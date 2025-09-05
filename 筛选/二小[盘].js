const { readFileSync } = require('fs');
const { getHtml } = $.require('./_lib.request.js');
const { formatPlayUrl } = misc;
let originalHosts;

const DOMAIN_CFG_PATH = './config/Domain.json';
const TOKEN_CFG_PATH = './config/tokenm.json';
const DEF_HOST = 'http://mihdr.top';
const SXUAN_CFG_PATH = './筛选/二小.json'; 

const config = JSON.parse(readFileSync(TOKEN_CFG_PATH, 'utf-8'));
try {
  const domainConfig = JSON.parse(readFileSync(DOMAIN_CFG_PATH, 'utf-8'));
  originalHosts = [...new Set(domainConfig.二小)];
  console.log('✅ 二小域名配置加载成功');
} catch (e) {
  console.error('❌ 二小域名配置文件读取失败，使用默认备用域名');
  originalHosts = [DEF_HOST];
}

let sxFilter = ''; // 新增filter变量
// 新增读取二小配置逻辑
try {
  const sxConfig = JSON.parse(readFileSync(SXUAN_CFG_PATH, 'utf-8'));
  sxFilter = sxConfig ;
  console.log('✅ 二小过滤器配置加载成功');
} catch (e) {
  console.error('❌ 二小过滤器配置文件读取失败，使用空配置');
  sxFilter = '';
}

const rule = {
  title: '二小[盘]',
  host: '',
  url: '/index.php/vod/show/id/fyfilter.html',
  searchUrl: '/index.php/vod/search/page/fypage/wd/**.html',
  headers: {
    "User-Agent": "PC_UA",
    'Accept': 'text/html; charset=utf-8',
    'Content-Type': 'text/html; charset=utf-8'
  },
  timeout: 10000,
  play_parse: true,
  double: false,
  searchable: 1,
  quickSearch: 1,

  // 域名检测
  hostJs: async function () {
    const TIMEOUT = 4000;
    const DEFAULT_DOMAIN = DEF_HOST;

    console.log('🚀 启动实时域名检测');

    const uniqueHosts = [...new Set(originalHosts)]
      .filter(host => typeof host === 'string' && host.trim() !== '');

    const normalizedHosts = uniqueHosts.map(host => {
      let url = host.trim();
      if (!url.startsWith('http')) url = `https://${url}`;
      return url.replace(/\/+$/, '');
    });

    const checkDomain = url => new Promise(resolve => {
      const protocol = url.startsWith('https') ? require('https') : require('http');
      const start = Date.now();

      const req = protocol.get(url, { timeout: TIMEOUT }, res => {
        const speed = Date.now() - start;
        const isValid = res.statusCode >= 200 && res.statusCode < 400;
        console.log(`${isValid ? '✅' : '❌'} ${url} 响应 ${speed}ms`);
        req.destroy();
        resolve({ url, speed, status: res.statusCode, valid: isValid });
      }).on('error', e => {
        console.log(`❌ ${url} 错误`);
        resolve({ url, speed: Infinity, valid: false });
      }).on('timeout', () => {
        console.log(`⚠️ ${url} 超时`);
        req.destroy();
        resolve({ url, speed: TIMEOUT, valid: false });
      });
    });

    const results = await Promise.all(normalizedHosts.map(url => checkDomain(url)));
    const validResults = results.filter(x => x.valid).sort((a, b) => a.speed - b.speed);

    if (validResults.length > 0) {
      console.log(`✅ 最终使用域名：${validResults[0].url}`);
      return validResults[0].url;
    } else {
      console.log(`⚠️ 使用默认域名：${DEFAULT_DOMAIN}`);
      return DEFAULT_DOMAIN;
    }
  },

  // 分类解析
  class_parse: async function() {
    const { input, pdfa, pd, pdfh, MY_CATE } = this;
    const classes = [];
    const cacheKey = `${input}_${MY_CATE || 'default'}`;

    if (this.cache?.[cacheKey]?.timestamp > Date.now() - 30*24*60*60*1000) {
      return this.cache[cacheKey];
    }

    const html = await request(input);
    const data = pdfa(html, '.grid-box&&ul&&li');

    data.forEach((it, index) => {
      const href = pd(it, 'a&&href');
      const typeName = pdfh(it, 'a&&Text').trim();
      const matchResult = href.match(/\/([^\/]+)\.html$/);

      if (matchResult && !['下载','网址','专题','全部影片'].some(k => typeName.includes(k))) {
        classes.push({
          type_name: typeName || `未命名-${index}`,
          type_id: matchResult[1]
        });
      }
    });

    if (!this.cache) this.cache = {};
    this.cache[cacheKey] = { class: classes, timestamp: Date.now() };
    return { class: classes };
  },

  推荐: async function () {
    let {input, pdfa, pdfh, pd} = this;
    let html = await request(input);
    let d = [];
    let data = pdfa(html, '.module-items .module-item');
    
    data.forEach((it) => {
        d.push({
            title: pd(it, 'a&&title'),
            pic_url: pd(it, 'img&&data-src'),
            desc: pdfh(it, '.module-item-text&&Text'),
            url: pd(it, 'a&&href')
        })
    });
  //  console.log('d的结果:', d);
    return setResult(d)
},

  一级: async function() {
    let { input, pdfa, pdfh, pd, MY_CATE, MY_FL, MY_PAGE } = this;
    const parts = [
      MY_FL.area ? `area/${MY_FL.area}` : '',
      MY_FL.by ? `by/${MY_FL.by}` : '',
      MY_FL.class ? `class/${MY_FL.class}` : '',
      MY_FL.cateId ? `id/${MY_FL.cateId}` : `id/${MY_CATE}`,
      MY_FL.lang ? `lang/${MY_FL.lang}` : '',
      MY_FL.letter ? `letter/${MY_FL.letter}` : '',
      MY_FL.year ? `year/${MY_FL.year}` : ''
    ].filter(Boolean);

    const url = `${this.host}/index.php/vod/show/${parts.join('/')}/page/${MY_PAGE}.html`;
    console.log(`📡 请求一级页面: ${url}`);
    let html = await request(url);
    let data = pdfa(html, '.module-items .module-item');
    console.log(`🔍 解析到 ${data.length} 个内容项`);
    return setResult(data.map(it => ({
      title: pd(it, 'a&&title'),
      pic_url: pd(it, 'img&&data-src'),
      desc: pdfh(it, '.module-item-text&&Text'),
      url: pd(it, 'a&&href')
    })));
  },

    二级: async function (ids) {
    let { input } = this;
    console.log(`📡 请求二级页面: ${input}`);
    let html = (await getHtml(input)).data;
    const $ = pq(html);
    let VOD = {
      vod_name: pdfh(html, 'h1&&Text'),
      type_name: pdfh(html, '.tag-link&&Text'),
      vod_pic: pd(html, '.lazyload&&data-original||data-src||src'),
      vod_content: pdfh(html, '.sqjj_a--span&&Text'),
      vod_remarks: pdfh(html, '.video-info-items:eq(3)&&Text'),
      vod_year: pdfh(html, '.tag-link:eq(2)&&Text'),
      vod_area: pdfh(html, '.tag-link:eq(3)&&Text'),
      vod_actor: pdfh(html, '.video-info-actor:eq(1)&&Text'),
      vod_director: pdfh(html, '.video-info-actor:eq(0)&&Text'),
    };

    console.log(`🔍 解析二级页面内容`);
    let playform = [];
    let playurls = [];
    let playPans = [];

    for (const item of $('.module-row-title')) {
      const a = $(item).find('p:first')[0];
      let link = a.children[0].data.trim();
 
let isKnownLink = false;

if (/pan.quark.cn/.test(link)) {
    isKnownLink = true;
    console.log(`🔍 检测到夸克网盘链接: ${link}`);
    playPans.push(link);
    let shareData = await Quark.getShareData(link);
    if (isValid(shareData)) {
        const videos = await Quark.getFilesByShareUrl(shareData);
        if (videos.length > 0) {
            playform.push(`Quark-${shareData.shareId}`);
            playurls.push(videos.map(v => {
                return `${v.file_name}$${[shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle?.fid || '', v.subtitle?.share_fid_token || ''].join('*')}`;
            }).join('#'));
        }
    } else {
        onFail("夸克网盘", link);
    }
}

if (/drive.uc.cn/.test(link)) {
    isKnownLink = true;
    console.log(`🔍 检测到优汐网盘链接: ${link}`);
    playPans.push(link);
    let shareData = await UC.getShareData(link);
    if (isValid(shareData)) {
        const videos = await UC.getFilesByShareUrl(shareData);
        if (videos.length > 0) {
            playform.push(`UC-${shareData.shareId}`);
            playurls.push(videos.map(v => {
                return `${v.file_name}$${[shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle?.fid || '', v.subtitle?.share_fid_token || ''].join('*')}`;
            }).join('#'));
        }
    } else {
        onFail("优汐网盘", link);
    }
}

if (/www.alipan.com|www.aliyundrive.com/.test(link)) {
    isKnownLink = true;
    console.log(`🔍 检测到阿里网盘链接: ${link}`);
    playPans.push(link);
    let shareData = await Ali.getShareData(link);
    if (isValid(shareData)) {
        const videos = await Ali.getFilesByShareUrl(shareData);
        if (videos.length > 0) {
            playform.push(`Ali-${shareData.shareId}`);
            playurls.push(videos.map(v => {
                return `${formatPlayUrl('', v.name)}$${[v.share_id, v.file_id, v.subtitle?.file_id || ''].join('*')}`;
            }).join('#'));
        }
    } else {
        onFail("阿里网盘", link);
    }
}

if (/yun.139.com/.test(link)) {
    isKnownLink = true;
    console.log(`🔍 检测到移动云盘链接: ${link}`);
    playPans.push(link);
    let data = await Yun.getShareData(link);
  //  console.log('data的结果:', data);
    if (isValid(data)) {
        Object.keys(data).forEach(it => {
            playform.push(`Yun-${it}`);
            playurls.push(data[it].map(item => `${item.name}$${[item.contentId, item.linkID].join('*')}`).join('#'));
        });
    } else {
        onFail("移动网盘", input);
    }
}

if (/cloud.189.cn/.test(link)) {
    isKnownLink = true;
    console.log(`🔍 检测到天翼云盘链接: ${link}`);
    playPans.push(link);
    let data = await Cloud.getShareData(link);
    if (isValid(data)) {
        Object.keys(data).forEach(it => {
            playform.push(`Cloud-${it}`);
            playurls.push(data[it].map(item => `${item.name}$${[item.fileId, item.shareId].join('*')}`).join('#'));
        });
    } else {
        onFail("天翼云盘", link);
    }
}

if (/www.123684.com|www.123865.com|www.123912.com|www.123pan.com|www.123pan.cn|www.123592.com/.test(link)) {
    isKnownLink = true;
    console.log(`🔍 检测到123网盘链接: ${link}`);
    playPans.push(link);
    let shareData = await Pan.getShareData(link);
    if (isValid(shareData)) {
        let videos = await Pan.getFilesByShareUrl(shareData);
        Object.keys(videos).forEach(it => {
            playform.push(`Pan123-${it}`);
            playurls.push(videos[it].map(v => {
                return `${v.FileName}$${[v.ShareKey, v.FileId, v.S3KeyFlag, v.Size, v.Etag].join('*')}`;
            }).join('#'));
        });
    } else {
        onFail("123网盘", link);
    }
}

// 检查是否是未知链接
if (!isKnownLink) {
    console.log(`⚠️ 未知链接: ${link}`);
 //   playurls.push("未知链接，请检查链接格式");
  //  playform.push('未知链接');
}

function isValid(data) {
    return data && Object.keys(data).length > 0 && !Object.values(data).some(v => v === null);
}

function onFail(diskName, link) {
    console.log(`❌ ${diskName}链接失效: ${link}`);
    playurls.push(`资源已经失效，请访问其他资源`);
    playform.push(`${diskName}线路失效`);
}

    }

    const lineOrder = config.lineOrder || [];
    const nameMapping = {
      'Quark': '夸克',
      'UC': '优汐',
      'Ali': '阿里',
      'Yun': '移动',
      'Pan123': '123',
      'Cloud': '天翼'
    };

    let processedLines = playform.map((line, index) => {
        const [originalPrefix, it] = line.split('-');
   //     if (originalPrefix === 'Ali') return null;
        const displayPrefix = nameMapping[originalPrefix] || originalPrefix;
        return { 
          raw: `${displayPrefix}-${it}`, 
          sortKey: originalPrefix,
          index
        };
      })
      .filter(item => item !== null);

    processedLines.sort((a, b) => {
  const aChineseName = nameMapping[a.sortKey] || a.sortKey;
  const bChineseName = nameMapping[b.sortKey] || b.sortKey;
  const aIndex = lineOrder.indexOf(aChineseName);
  const bIndex = lineOrder.indexOf(bChineseName);
  return (aIndex === -1 ? 9999 : aIndex) - (bIndex === -1 ? 9999 : bIndex);
});

    const countMap = {};
    processedLines = processedLines.map(item => {
      if (['Yun', 'Cloud','Pan123'].includes(item.sortKey) && item.raw !== '天翼-root') {
        return item;
      }
      countMap[item.sortKey] = (countMap[item.sortKey] || 0) + 1;
      item.raw = `${item.raw.split('-')[0]}#${countMap[item.sortKey]}`;
      return item;
    });

    VOD.vod_play_from = processedLines.map(item => item.raw).join("$$$");
    VOD.vod_play_url = processedLines.map(item => playurls[item.index]).join("$$$");
    VOD.vod_play_pan = playPans.join("$$$");
    console.log(`✅ 二级页面解析完成`);
    return VOD;
  },
 

  

  // 搜索框功能
  搜索: async function (wd, quick, pg) {
    let { input, pdfa, pdfh, pd } = this;
    console.log(`📡 请求搜索内容: ${input}`);
    let html = await request(input);
    let data = pdfa(html, '.module-items .module-search-item');
    console.log(`🔍 解析到 ${data.length} 个搜索结果`);
    return setResult(data.map(it => ({
      title: pdfh(it, 'img&&alt'),
      pic_url: pd(it, 'img&&data-src'),
      desc: pdfh(it, '.video-serial&&Text'),
      url: pd(it, 'a:eq(-1)&&href'),
      content: pdfh(it, '.video-info-items:eq(-1)&&Text'),
    })));
  },

  // 懒加载解析
  lazy: async function (flag, id, flags) {
    let { input, mediaProxyUrl } = this;
    const ids = input.split('*');
    const urls = [];
    const threadCount = config.thread || 10;
    const threadParam = `thread=${threadCount}`;
    const playProxy = config.play_proxy || 1;

    console.log(`🚀 开始解析网盘链接: ${flag}`);

    if (flag.startsWith('夸克')) {
      console.log("🔍 解析夸克网盘链接");
      const down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'origin': 'https://pan.quark.cn',
        'referer': 'https://pan.quark.cn/',
        'Cookie': Quark.cookie
      };
      urls.push("通用原画", `http://127.0.0.1:5575/proxy?${threadParam}&chunkSize=256&url=${encodeURIComponent(down.download_url)}`);
      (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter(t => t.accessable).forEach(t => {
        urls.push(t.resolution === 'low' ? "流畅" : t.resolution === 'high' ? "高清" : t.resolution === 'super' ? "超清" : t.resolution, t.video_info.url);
      });
      console.log(`✅ 夸克网盘解析完成`);
      return { parse: 0, url: urls, header: headers };
    }

    if (flag.startsWith('优汐')) {
      console.log("🔍 解析优汐网盘链接");
      (await UC.getDownload(ids[0], ids[1], ids[2], ids[3], true)).forEach(t => {
        urls.push(t.name === 'low' ? "流畅" : t.name === 'high' ? "高清" : t.name === 'super' ? "超清" : t.name, t.url);
      });
      console.log(`✅ 优汐网盘解析完成`);
      return { parse: 0, url: urls };
    }

    if (flag.startsWith('阿里')) {
      console.log("🔍 解析阿里网盘链接");
      const down = await Ali.getDownload(ids[0], ids[1], flag === 'down');
      urls.push("原画", down.url + "#isVideo=true##ignoreMusic=true#");
      (await Ali.getLiveTranscoding(ids[0], ids[1])).sort((a, b) => b.template_width - a.template_width).forEach(t => {
        if (t.url !== '') urls.push(`${t.template_id}`, t.url);
      });
      console.log(`✅ 阿里网盘解析完成`);
      return {
        parse: 0,
        url: urls,
        header: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://www.aliyundrive.com/',
        },
      };
    }

    if (flag.startsWith('移动')) {
      console.log("🔍 解析移动云盘链接");
      const url = await Yun.getSharePlay(ids[0], ids[1]);
      console.log(`✅ 移动云盘解析完成`);
      return { url };
    }

    if (flag.startsWith('天翼')) {
      console.log("🔍 解析天翼云盘链接");
      const url = await Cloud.getShareUrl(ids[0], ids[1]);
      console.log(`✅ 天翼云盘解析完成`);
      return { url: url + "#isVideo=true#" };
    }

    if (flag.startsWith('123')) {
      console.log("🔍 解析123网盘链接");
      const url = await Pan.getDownload(ids[0], ids[1], ids[2], ids[3], ids[4]);
      urls.push("原画", url);
      (await Pan.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3], ids[4])).forEach(item => {
        urls.push(item.name, item.url);
      });
      console.log(`✅ 123网盘解析完成`);
      return { parse: 0, url: urls };
    }
  },
  filter: sxFilter,
};