/*
@header({
  lang: 'ds'
})
*/


const { readFileSync } = require('fs');
const { requestJson } = $.require('./_lib.request.js');
const { formatPlayUrl } = misc;

let _name = '' ;
let Sxuan = '' ;
let config = {};

let DOMAIN_CFG_PATH = './pz/Domain.json';
let TOKEN_CFG_PATH = './pz/tokenm.json';
let paix = ['天翼', '123', '移动', '夸克', '优汐', '阿里'];
let original = { '夸克': false, '阿里': true, '优汐': true, '移动': true, '天翼': true, '123': true };

const cache = {
    classParse: {
        cache: {},
        cacheDuration: 30 * 24 * 60 * 60 * 1000,
        isCacheValid(key) { return this.cache[key] && this.cache[key].timestamp > Date.now() - this.cacheDuration; }
    }
};

const rule = {
    title: '盘类[模版]',
    host: '',
    url: '',
    searchUrl: '*',
    headers: { "User-Agent": "PC_UA", 'Accept': 'text/html; charset=utf-8' },
    timeout: 10000,
    play_parse: true,
    double: false,
    searchable: 1,
    quickSearch: 1,

    hostJs: async function () {
        let _host = rule.params.split('$')[0];
        _name = rule.params.split('$')[1] || '默认';
        console.log(`_host: ${_host}, _name: ${_name}`);

        try {
            const tokenConfig = JSON.parse(readFileSync(TOKEN_CFG_PATH, 'utf-8'));
            Object.assign(config, tokenConfig);
            console.log(`${_name}配置ck加载成功`);
        } catch (e) {
            console.error(`${_name}读取ck失败，启用默认配置: ${e.message}`);
            config = {};
        }

        let originalHosts = _name;
        try {
            const domainConfig = JSON.parse(readFileSync(DOMAIN_CFG_PATH, 'utf-8'));
            originalHosts = [...new Set(domainConfig[_name])];
            console.log(`${_name}域名配置加载成功`);
        } catch (e) {
            console.error(`${_name}域名配置读取失败，使用默认域名`);
        }

        rule.lineOrder = config.lineOrder || paix;
        rule.threadParam = `thread=${config.thread || 20}`;
        rule.showOriginal = config.showOriginal || original;

        if (!Array.isArray(originalHosts) || originalHosts.length === 0) {
            console.error(`${_name}无有效域名，使用默认域名`);
            return _host;
        }

        const checkDomain = url => new Promise(resolve => {
            const protocol = url.startsWith('https') ? require('https') : require('http');
            const start = Date.now();
            const req = protocol.get(url, { timeout: 4000 }, res => {
                const speed = Date.now() - start;
                const valid = res.statusCode >= 200 && res.statusCode < 400;
                console.log(`${valid ? '√' : '×'} ${url} (${speed}ms)`);
                req.destroy();
                resolve({ url, speed, valid });
            }).on('error', () => resolve({ url, speed: Infinity, valid: false }))
              .on('timeout', () => { req.destroy(); resolve({ url, speed: 4000, valid: false }); });
        });

        const results = await Promise.all(originalHosts.map(checkDomain));
        const valid = results.filter(x => x.valid).sort((a, b) => a.speed - b.speed);
        return valid.length ? (console.log(`${_name}使用域名：${valid[0].url}`), valid[0].url) : 
                              (console.log(`${_name}使用默认域名：${_host}`), _host);
    },

    class_parse: async function () {
        const { input, pdfa, pd, pdfh, MY_CATE } = this;
        const classes = [], filters = {};
        const cacheKey = `${input}_${MY_CATE || 'default'}`;
        Sxuan = `./筛选/${_name}.json`;
        try {
            const rawData = readFileSync(Sxuan, 'utf-8');
            const { class: fileClasses, filters: fileFilters } = JSON.parse(rawData);
            if (Array.isArray(fileClasses) && Object.keys(fileFilters).length > 0) {
                console.log(`${_name}加载本地分类配置`);
                cache.classParse.cache[cacheKey] = { class: fileClasses, filters: fileFilters, timestamp: Date.now() };
                return { class: fileClasses, filters: fileFilters };
            }
        } catch (e) {
            console.log(`${_name}本地分类配置加载失败: ${e.message}`);
        }

        console.log(`${_name}分类解析完成（${classes.length}个）`);
        return { class: classes, filters };
    },

    推荐: async function () {
        let { input, pdfa, pdfh, pd } = this;
        console.log(`请求推荐页面: ${input}`);
        let html = await request(input);
        let d = [];
        pdfa(html, '.module-items .module-item').forEach(it => {
            let title = pdfh(it, 'a&&title');
            let desc = pdfh(it, '.module-item-text&&Text');
            if (!title.includes('虎斑') && !desc.includes('虎斑')) {
                d.push({
                    title,
                    pic_url: pd(it, 'img&&data-src'),
                    desc,
                    url: pd(it, 'a&&href')
                });
            }
        });
        console.log(`推荐页面解析完成`);
        return setResult(d);
    },

    一级: async function () {
        let { input, pdfa, pdfh, pd, MY_CATE, MY_FL, MY_PAGE, host } = this;
        console.log(`请求一级页面: ${input}`);
        let d = [], fl = MY_FL, pg = MY_PAGE, type = fl.cateId || MY_CATE;

        const parts = [
            fl.area && `area/${fl.area}`,
            fl.by && `by/${fl.by}`,
            fl.class && `class/${fl.class}`,
            fl.cateId ? `id/${fl.cateId}` : `id/${MY_CATE}`,
            fl.lang && `lang/${fl.lang}`,
            fl.letter && `letter/${fl.letter}`,
            fl.year ? `year/${fl.year}` : (fl.version ? `version/${fl.version}` : '')
        ].filter(Boolean);

        const url1 = `${host}/vodshow/${type}-${fl.area || ''}-${fl.by || 'time'}-${fl.class || ''}--${fl.letter || ''}---${pg}---${fl.year || ''}.html`;
        const url2 = `${host}/index.php/vod/show/${parts.join('/')}/page/${pg}.html`;
        let [html1, html2] = await Promise.all([request(url1), request(url2)]);
        let has1 = html1.includes('module'), has2 = html2.includes('module');
        let html = has1 ? html1 : has2 ? html2 : null;
        let selectedUrl = has1 ? url1 : has2 ? url2 : null;

        console.log(`选择URL: ${selectedUrl || '无有效'}`);
        if (!html) return setResult(d);

        pdfa(html, '.module-items .module-item').forEach(it => {
            let title = pdfh(it, 'a&&title'), desc = pdfh(it, '.module-item-text&&Text');
            if (!title.includes('虎斑') && !desc.includes('虎斑')) {
                d.push({ title, pic_url: pd(it, 'img&&data-src'), desc, url: pd(it, 'a&&href') });
            }
        });
        console.log(`一级页面解析完成`);
        return setResult(d);
    },

    搜索: async function search(wd, quick, pg) {
        let { input, pdfa, pdfh, pd, host } = this;
        const url1 = `${host}/vodsearch/${wd}----------${pg}---.html`;
        const url2 = `${host}/index.php/vod/search/page/${pg}/wd/${wd}.html`;
        let [html1, html2] = await Promise.all([request(url1), request(url2)]);
        let has1 = html1.includes('module'), has2 = html2.includes('module');
        let html = has1 ? html1 : has2 ? html2 : '', selectedUrl = has1 ? url1 : has2 ? url2 : null;

        console.log(`选择URL: ${selectedUrl || '无有效'}`);
        let d = [];
        pdfa(html, '.module-items .module-search-item').forEach(it => {
            let title = pdfh(it, '.video-info&&a&&title');
            if (!title.includes('排除关键词')) {
                d.push({
                    title,
                    pic_url: pd(it, 'img&&data-src'),
                    desc: pdfh(it, '.video-text&&Text'),
                    url: pd(it, '.video-info&&a&&href'),
                    content: pdfh(it, '.video-info-items:eq(-1)&&Text')
                });
            }
        });
        return setResult(d);
    },

    二级: async function (ids) {
        const { input } = this;
        console.log(`请求二级页面: ${input}`);
        const html = await request(input), $ = pq(html);
        const VOD = {
            vod_name: pdfh(html, '.video-info&&h1&&Text'),
            type_name: pdfh(html, '.tag-link&&Text'),
            vod_pic: pd(html, '.lazyload&&data-original||data-src||src'),
            vod_content: pdfh(html, '.sqjj_a--span&&Text'),
            vod_remarks: pdfh(html, '.video-info-items:eq(3)&&Text'),
            vod_year: pdfh(html, '.tag-link:eq(2)&&Text'),
            vod_area: pdfh(html, '.tag-link:eq(3)&&Text'),
            vod_actor: pdfh(html, '.video-info-actor:eq(1)&&Text'),
            vod_director: pdfh(html, '.video-info-actor:eq(0)&&Text')
        };

        const playform = [], playurls = [], playPans = [];
        const EXCLUDE_LINKS = ['pan.quark.cn/s/409afef6d77c', 'drive.uc.cn/s/3544ba9f8ac64'];
        const isValid = data => data && Object.keys(data).length > 0 && !Object.values(data).some(v => v === null);
        const onFail = (diskName, link) => {
            console.log(`${diskName}链接失效: ${link}`);
            playurls.push('资源已失效，请访问其他资源');
            playform.push(`${diskName}线路失效`);
        };

        const data = pdfa(html, '.module-row-title');
        if (!isValid(data) || !Object.values(data).some(v => typeof v === 'string' && v.includes('http'))) {
            onFail("未知", JSON.stringify(data));
        }

        const diskHandlers = {
            '夸克': { test: /pan.quark/, handler: async link => {
                const shareData = await Quark.getShareData(link);
                if (isValid(shareData)) {
                    const videos = await Quark.getFilesByShareUrl(shareData);
                    if (videos.length) {
                        playform.push(`夸克-${shareData.shareId}`);
                        playurls.push(videos.map(v => `${v.file_name}$${[shareData.shareId, v.stoken, v.fid, v.share_fid_token].join('*')}`).join('#'));
                    }
                } else onFail("夸克网盘", link);
            }},
            '优汐': { test: /drive.uc/, handler: async link => {
                const shareData = await UC.getShareData(link);
                if (isValid(shareData)) {
                    const videos = await UC.getFilesByShareUrl(shareData);
                    if (videos.length) {
                        playform.push(`优汐-${shareData.shareId}`);
                        playurls.push(videos.map(v => `${v.file_name}$${[shareData.shareId, v.stoken, v.fid, v.share_fid_token].join('*')}`).join('#'));
                    }
                } else onFail("优汐网盘", link);
            }},
            '阿里': { test: /alipan|aliyundrive/, handler: async link => {
                const shareData = await Ali.getShareData(link);
                if (isValid(shareData)) {
                    const videos = await Ali.getFilesByShareUrl(shareData);
                    if (videos.length) {
                        playform.push(`阿里-${shareData.shareId}`);
                        playurls.push(videos.map(v => `${formatPlayUrl('', v.name)}$${[v.share_id, v.file_id].join('*')}`).join('#'));
                    }
                } else onFail("阿里网盘", link);
            }},
            '移动': { test: /yun.139/, handler: async link => {
                const data = await Yun.getShareData(link);
                if (isValid(data)) Object.keys(data).forEach(it => {
                    playform.push(`移动-${it}`);
                    playurls.push(data[it].map(item => `${item.name}$${[item.contentId, item.linkID].join('*')}`).join('#'));
                }); else onFail("移动网盘", link);
            }},
            '天翼': { test: /cloud.189/, handler: async link => {
                const data = await Cloud.getShareData(link);
                if (isValid(data)) Object.keys(data).forEach(it => {
                    playform.push(`天翼-${it}`);
                    playurls.push(data[it].map(item => `${item.name}$${[item.fileId, item.shareId].join('*')}`).join('#'));
                }); else onFail("天翼云盘", link);
            }},
            '123': { test: /www.123/i, handler: async link => {
                const shareData = await Pan.getShareData(link);
                if (isValid(shareData)) {
                    const videos = await Pan.getFilesByShareUrl(shareData);
                    Object.keys(videos).forEach(it => {
                        playform.push(`123-${it}`);
                        playurls.push(videos[it].map(v => `${v.FileName}$${[v.ShareKey, v.FileId, v.S3KeyFlag, v.Size, v.Etag].join('*')}`).join('#'));
                    });
                } else onFail("123网盘", link);
            }}
        };

        for (const item of data) {
            const link = $(item).find('p:first')[0].children[0].data.trim()
                .replace(/\s+/g, '').replace(/提取码[：:]/g, '?').replace(/\?+/g, '?').replace(/,\?/g, '?');
            if (EXCLUDE_LINKS.some(exclude => link.includes(exclude))) {
                console.log(`排除链接: ${link}`);
                continue;
            }
            playPans.push(link);
            let handled = false;
            for (const [diskName, { test, handler }] of Object.entries(diskHandlers)) {
                if (test.test(link)) {
                    await handler(link);
                    handled = true;
                    break;
                }
            }
            if (!handled) console.log(`未知链接: ${link}`);
        }

        let processedLines = playform.map((line, index) => ({ raw: line, sortKey: line.split('-')[0], index }));
        processedLines.sort((a, b) => {
            const aIdx = rule.lineOrder.indexOf(a.sortKey);
            const bIdx = rule.lineOrder.indexOf(b.sortKey);
            return (aIdx === -1 ? 9999 : aIdx) - (bIdx === -1 ? 9999 : bIdx);
        });

        const countMap = {};
        processedLines = processedLines.map(item => {
            if (['移动', '天翼', '123'].includes(item.sortKey) && item.raw !== '天翼-root') return item;
            countMap[item.sortKey] = (countMap[item.sortKey] || 0) + 1;
            item.raw = `${item.raw.split('-')[0]}#${countMap[item.sortKey]}`;
            return item;
        });

        VOD.vod_play_from = processedLines.map(item => item.raw).join("$$$");
        VOD.vod_play_url = processedLines.map(item => playurls[item.index]).join("$$$");
        VOD.vod_play_pan = playPans.join("$$$");
        console.log(`二级页面解析完成`);
        return VOD;
    },

    lazy: async function (flag, id, flags) {
        let {getProxyUrl, input,mediaProxyUrl} = this;
        const ids = input.split('*'), urls = [];
        const threadParam = rule.threadParam, showOriginal = rule.showOriginal || original;
        console.log(`解析网盘链接: ${flag}`);

        const diskHandlers = {
            '夸克': async () => {
                const down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
                if (showOriginal['夸克']) 
                urls.push("原画", `${down.download_url}`);
              //  urls.push("通用原画", `http://127.0.0.1:5575/proxy?${threadParam}&chunkSize=32&poolSize=128&url=${encodeURIComponent(down.download_url)}`);
              //  urls.push("原代服", mediaProxyUrl + `?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=${encodeURIComponent(down.download_url)}`);
            
            urls.push("原代本", `http://127.0.0.1:7777/?${threadParam}&form=urlcode&randUa=1&url=${encodeURIComponent(down.download_url)}`);
            urls.push("原代本", `http://127.0.0.1:5575/proxy?${threadParam}&chunkSize=256&url=${encodeURIComponent(down.download_url)}`);
            
                (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter(t => t.accessable).forEach(t => {
                    const res = t.resolution === 'low' ? "流畅" : t.resolution === 'normal' ? "清晰" : t.resolution === 'high' ? "高清" : t.resolution === 'super' ? "超清" : t.resolution === 'dolby_vision' ? "HDR" : t.resolution;
                    urls.push(res, `${t.video_info.url}`);
                  //  urls.push(res, `http://127.0.0.1:5575/proxy?${threadParam}&chunkSize=32&poolSize=128&url=${encodeURIComponent(t.video_info.url)}`);
                });
                return { parse: 0, url: urls, header: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'origin': 'https://pan.quark.cn', 'referer': 'https://pan.quark.cn/', 'Cookie': Quark.cookie } };
            },
            '优汐': async () => {
                const down = await UC.getDownload(ids[0], ids[1], ids[2], ids[3], true);
                const downUrl = down.url;
                if (showOriginal['优汐']) urls.push("通用原画", `http://127.0.0.1:5575/proxy?${threadParam}&chunkSize=32&poolSize=128&url=${encodeURIComponent(downUrl)}`);
                down.forEach(t => {
                    const res = t.name === 'low' ? "流畅" : t.name === 'high' ? "高清" : t.name === 'super' ? "超清" : t.name === 'dolby_vision' ? "HDR" : t.name;
                    urls.push(res, `${t.url}`);
                });
                return { parse: 0, url: urls };
            },
            '阿里': async () => {
                const transcoding_flag = { UHD: "4K 超清", QHD: "2K 超清", FHD: "1080 全高清", HD: "720 高清", SD: "540 标清", LD: "360 流畅" };
                const down = await Ali.getDownload(ids[0], ids[1], flag === 'down');
                if (showOriginal['阿里']) urls.push("极速原画", `${down.url}&${threadParam}`);
                (await Ali.getLiveTranscoding(ids[0], ids[1])).sort((a, b) => b.template_width - a.template_width).forEach(t => {
                    urls.push(transcoding_flag[t.template_id], `${t.url}&${threadParam}`);
                });
                return { parse: 0, url: urls, header: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'Referer': 'https://www.aliyundrive.com/' } };
            },
            '移动': async () => {
                const url = await Yun.getSharePlay(ids[0], ids[1]);
                return { url: `${url}&${threadParam}` };
            },
            '天翼': async () => {
                const url = await Cloud.getShareUrl(ids[0], ids[1]);
                return { url: `${url}&${threadParam}` };
            },
            '123': async () => {
                const url = await Pan.getDownload(ids[0], ids[1], ids[2], ids[3], ids[4]);
                if (showOriginal['123']) urls.push("原画", url);
                (await Pan.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3], ids[4])).forEach(item => {
                    urls.push(item.name, `${item.url}&${threadParam}`);
                });
                return { parse: 0, url: urls };
            }
        };

        for (const [prefix, handler] of Object.entries(diskHandlers)) {
            if (flag.startsWith(prefix)) return await handler();
        }
    }
};
