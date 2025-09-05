/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '盘Ta[模版]',
  lang: 'ds'
})
*/

const { req_, req_proxy } = $.require('./_lib.request.js');
const { formatPlayUrl } = misc;
const { readFileSync } = require('fs');


var rule = {
  title: '盘Ta[模版]',
  host: '',
  url: '/?tagId=fyclass&page=fypage',
  detailUrl: '/fyid',
  searchUrl: '/search?keyword=**&page=fypage',
  searchable: 2,
  quickSearch: 0,
  play_parse: true,

  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
  },
  
  hostJs: async function () {
  //console.log('✅rule.params的结果:', rule.params);
    let _host = rule.params.split('$')[0];
    let _name = rule.params.split('$')[1] || '默认';
    let _shaix = `./筛选/${_name}.json`; // 动态生成路径
    rule._name = _name ; 
    rule._shaix = _shaix ;
  //  console.log('✅_host的结果:', _host);
   // console.log('✅_name的结果:', _name);
     return _host;
    },
    
    
    
class_parse: async function() {
  try {
   // console.log('✅ rule._shaix 的结果:', rule._shaix);
    
    const rawData = readFileSync(rule._shaix, 'utf-8');
    const data = JSON.parse(rawData);
    const { class: fileClasses } = data;
    return { 
      class: fileClasses || [] 
    };
  } catch (error) {
    console.error('❌ 解析失败:', error);
    return { class: [] }; // 确保始终返回有效结构
  }
},



    一级: async function (tid, pg, filter, extend) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await req_(input, 'get', this.headers);
    const $ = pq(html);
    let d = [];
    let data = pdfa(html, '.topicList .topicItem');
   // let _name = rule._name;
    // 定义差异化配置（可根据需求扩展为参数或动态逻辑）
    const defaultImages = {
        mobile: 'https://cnb.cool/zhyadc/YsBox/-/git/raw/main/img/移动.png',
        telecom: 'https://cnb.cool/zhyadc/YsBox/-/git/raw/main/img/天翼.png'
    };
    console.log('✅_name的结果:', rule._name);
    // 示例：根据 extend 参数选择默认图（可自定义逻辑）
   // const defaultPic = rule._name === '盘它' ? defaultImages.mobile : defaultImages.telecom;
    let defaultPic;
if (rule._name === '盘它') {
  defaultPic = defaultImages.mobile;
} else if (rule._name === '雷鲸') {
  defaultPic = defaultImages.telecom;
}
    data.forEach((it) => {
        let title = pdfh(it, 'h2&&Text');
        // 使用统一的默认图逻辑
        let picUrl = pd(it, 'ul.tm-m-photos-thumb&&li&&data-src') || defaultPic;
        let url = pd(it, 'a[href*="thread?topicId="]&&href');

        if (!title.includes('PDF') && !it.includes('pdf')) {
            d.push({
                title: title,
                pic_url: picUrl,
                url: url
            });
        }
    });
    return setResult(d);
},

  二级: async function (ids) {
    let { input } = this;
    console.log('input的结果:', input);
    let html = await req_(input, 'get', this.headers || {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36'
    });
    const $ = pq(html);
    let vod = {
        "vod_name": $('.title').text().trim(),
        "vod_id": input,
        "vod_content": $('div.topicContent p:nth-child(1)').text()
    };

    // 统一链接匹配逻辑（支持两种网盘）
    const content_html = $('.topicContent').html();
    const linkRegex = /(https:\/\/(?:cloud\.189\.cn|caiyun\.139\.com)\/[^"'><]*)/gi;
    let link = content_html.match(linkRegex);
    
    // 提取主链接
    if (!link || link.length === 0) {
        throw new Error('未找到有效网盘链接');
    }
    link = link[0].trim(); // 取第一个匹配结果
    log(`✅link的结果: ${link}`);
    // 配置差异化处理逻辑
    const panConfig = {
        'cloud.189.cn': {
            module: Cloud,
            keyMap: { id: 'fileId', share: 'shareId' },
            prefix: '天翼-'
        },
        'caiyun.139.com': {
            module: Yun,
            keyMap: { id: 'contentId', share: 'linkID' },
            prefix: '移动-',
            needShareID: true // 标记需要先获取shareID（即linkID）
        }
    };

    // 解析网盘类型
    const panType = link.match(/(cloud\.189\.cn|caiyun\.139\.com)/)[1];
    const { module, keyMap, prefix, needShareID } = panConfig[panType];
    
    if (!module) {
        throw new Error(`❌不支持的网盘类型: ${panType}`);
    }

    // 统一处理流程
    const playPans = [link];
    const playform = [];
    const playurls = [];

    try {
        // 针对移动彩云：先获取linkID（通过getShareID）
        let shareID = null;
        if (needShareID) {
            shareID = await module.getShareID(link); // 补充获取linkID的步骤
            if (!shareID) {
                throw new Error(`获取${panType}的linkID失败`);
            }
        }

        // 传入shareID（若需要）获取数据
        const data = await module.getShareData(link, shareID); // 新增shareID参数
        log(`✅data的结果: ${JSON.stringify(data, null, 4)}`);
        
        Object.keys(data).forEach(category => {
            playform.push(`${prefix}${category}`);
            const urls = data[category].map(item => {
                // 移动彩云使用获取到的shareID作为linkID
                const shareParam = needShareID ? shareID : item[keyMap.share];
                return `${item.name}$${[item[keyMap.id], shareParam].join('*')}`;
            }).join('#');
            playurls.push(urls);
        });
    } catch (error) {
        console.error(`获取${panType}数据失败:`, error);
    }

    // 组装结果
    vod.vod_play_from = playform.join("$$$");
    vod.vod_play_url = playurls.join("$$$");
    vod.vod_play_pan = playPans.join("$$$");
    
    return vod;
},


  搜索: async function (tid, pg, filter, extend) {
    return this.一级(tid, pg, filter, extend);
    // let 一级 = rule.一级.bind(this);
    //   return await 一级();
  },
  lazy: async function (flag, id, flags) {
    let { getProxyUrl, input } = this;
    const ids = input.split('*');
    if (flag.startsWith('移动-')) {
      log('移动云盘解析开始')
      const url = await Yun.getSharePlay(ids[0], ids[1])
      return {
        url: url
      }
    }
    if (flag.startsWith('天翼-')) {
            log("天翼云盘解析开始")
            const url = await Cloud.getShareUrl(ids[0], ids[1]);
            return {
                url: url + "#isVideo=true#",
            }
        }
  }
};
