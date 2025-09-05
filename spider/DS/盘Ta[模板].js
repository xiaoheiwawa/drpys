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
const { readFileSync } = require('fs');


let Do_Path = './pz/Domain.json';
let Do_Data = JSON.parse(readFileSync(Do_Path, 'utf-8'));

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
    hostJs: async function() {
        try {
            if (rule.params) rule.params = ungzip(rule.params);
        } catch (e) {
            console.log(`[hostJs] ungzip解密失败: ${e.message}`);
        }
        let _host = rule.params.split('$')[0];
        let _name = rule.params.split('$')[1] || '默认';
        let _shaix = `./筛选/${_name}.json`; 
        let json = Do_Data[_name] || {};
        if (!/^https?:\/\//i.test(_host)) {
        log(`⚠️ _host 不是域名`);
            _host = json[0];
        }
        rule._name = _name;
        rule._shaix = _shaix;
        return _host;
    },
    class_parse: async function() {
        try {
            // 使用已初始化的`rule._shaix`（依赖hostJs中定义的`_name`）
            const rawData = readFileSync(rule._shaix, 'utf-8');
            const data = JSON.parse(rawData);
            const { class: fileClasses } = data;
            return { class: fileClasses || [] };
        } catch (error) {
            return { class: [] };
        }
    },
    一级: async function(tid, pg, filter, extend) {
        let { input, pdfa, pdfh, pd } = this;
        let html = await req_(input, 'get', this.headers);
        const $ = pq(html);
        let d = [];
        let data = pdfa(html, '.topicList .topicItem');
        const defaultImages = {
            mobile: 'https://cnb.cool/zhyadc/YsBox/-/git/raw/main/img/移动.png',
            telecom: 'https://cnb.cool/zhyadc/YsBox/-/git/raw/main/img/天翼.png'
        };
        let defaultPic = rule._name === '盘它' ? defaultImages.mobile : 
                       rule._name === '雷鲸' ? defaultImages.telecom : '';
        data.forEach((it) => {
            let title = pdfh(it, 'h2&&Text');
            let picUrl = pd(it, 'ul.tm-m-photos-thumb&&li&&data-src') || defaultPic;
            let url = pd(it, 'a[href*="thread?topicId="]&&href');
            if (!title.includes('PDF') && !it.includes('pdf')) {
                d.push({ title, pic_url: picUrl, url });
            }
        });
        return setResult(d);
    },
    二级: async function(ids) {
        let { input } = this;
        let html = await req_(input, 'get', this.headers);
        const $ = pq(html);
        let vod = {
            "vod_name": $('.title').text().trim(),
            "vod_id": input,
            "vod_content": $('div.topicContent p:nth-child(1)').text()
        };
        const content_html = $('.topicContent').html();
        const linkRegex = /(https:\/\/(?:cloud\.189\.cn|caiyun\.139\.com)\/[^"'><]*)/gi;
        let link = content_html.match(linkRegex);
        if (!link || link.length === 0) {
            throw new Error('未找到有效网盘链接');
        }
        link = link[0].trim();
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
                needShareID: true
            }
        };
        const panType = link.match(/(cloud\.189\.cn|caiyun\.139\.com)/)[1];
        const { module, keyMap, prefix, needShareID } = panConfig[panType];
        if (!module) {
            throw new Error(`❌不支持的网盘类型: ${panType}`);
        }
        const playPans = [link];
        const playform = [];
        const playurls = [];
        try {
            let shareID = null;
            if (needShareID) {
                shareID = await module.getShareID(link);
                if (!shareID) throw new Error(`获取${panType}的linkID失败`);
            }
            const data = await module.getShareData(link, shareID);
            Object.keys(data).forEach(category => {
                playform.push(`${prefix}${category}`);
                const urls = data[category].map(item => {
                    const shareParam = needShareID ? shareID : item[keyMap.share];
                    return `${item.name}$${[item[keyMap.id], shareParam].join('*')}`;
                }).join('#');
                playurls.push(urls);
            });
        } catch (error) {
            console.error(`获取${panType}数据失败:`, error);
        }
        vod.vod_play_from = playform.join("$$$");
        vod.vod_play_url = playurls.join("$$$");
        vod.vod_play_pan = playPans.join("$$$");
        return vod;
    },
    搜索: async function(tid, pg, filter, extend) {
        return this.一级(tid, pg, filter, extend);
    },
    lazy: async function(flag, id, flags) {
        let { getProxyUrl, input } = this;
        const ids = input.split('*');
        if (flag.startsWith('移动-')) {
            log('移动云盘解析开始')
            const url = await Yun.getSharePlay(ids[0], ids[1])
            return { url };
        }
        if (flag.startsWith('天翼-')) {
            log("天翼云盘解析开始")
            const url = await Cloud.getShareUrl(ids[0], ids[1]);
            return { url: url + "#isVideo=true#" };
        }
    }
};
