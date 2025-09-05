/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '可可',
  author: '不告诉你',
  '类型': '影视',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: '可可影视',
    author: '不告诉你',
    logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
    host: 'https://www.keke8.app/',
    // 备用域名（若主站失效）
    // host: 'https://www.kkys01.com/',

    url: '/show/fyclass-fyfilter-fypage.html',
    searchUrl: '/search?k=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    double: true,
    timeout: 10000,
    play_parse: true,
    headers: {
        'User-Agent': PC_UA,
    },

    class_name: '电影&连续剧&动漫&综艺&短剧',
    class_url: '1&2&3&4&6',
    filter_url: '{{fl.类型}}-{{fl.地区}}-{{fl.语言}}-{{fl.年份}}-{{fl.排序}}',
    filter_def: { '1': { 类型: '1' }, '2': { 类型: '2' }, '3': { 类型: '3' }, '4': { 类型: '4' }, '6': { 类型: '6' } },

    预处理: async () => {
        // 可在此进行初始化，如设置全局变量
        log('可可影视规则已加载');
        return [];
    },

    推荐: async function (tid, pg, filter, extend) {
        let homeFn = rule.一级.bind(this);
        // 请求首页
        let html = await this.request(this.host + '/');
        // 将整个HTML传给一级解析函数
        return await homeFn(html);
    },

    一级: async function (tid, pg, filter, extend) {
        let { input, pdfa, pdfh, pd } = this;
        // input 可能是 url 或 html 字符串
        let isStr = typeof input === 'string';
        let html = isStr && (input.startsWith('http') || input.length > 1000) ? input : await request(input);
        let $ = html.html();

        let d = [];
        // 解析所有影片条目
        $('.module-v-box .module-item').each((index, el) => {
            let $item = $(el);
            d.push({
                title: pdfh($item, '.v-item-footer .v-item-title:eq(1) && Text'),
                pic_url: pd($item, 'img[data-original]:not([src*="logo_placeholder"]) && data-original'),
                desc: pdfh($item, '.v-item-bottom && Text'),
                url: pd($item, 'a && href')
            });
        });
        return setResult(d);
    },

    二级: async function (ids) {
        let { input, pdfa, pdfh, pd } = this;
        let html = await request(input);
        let $ = html.html();
        let VOD = {};

        // 基本信息
        VOD.vod_name = pdfh(html, '.detail-title h1&&Text||.detail-pic img&&alt'); // 名称
        VOD.vod_pic = pd(html, '.detail-pic img&&data-original'); // 封面
        VOD.vod_actor = pdfh(html, '.detail-tags a:eq(0)&&Text'); // 演员（通常为类型，但按标准字段填充）
        VOD.vod_director = pdfh(html, '.detail-tags a:eq(1)&&Text'); // 导演（通常为地区）
        VOD.vod_remarks = pdfh(html, '.v-item-top-left&&Text'); // 备注（豆瓣评分）
        VOD.vod_status = pdfh(html, '.detail-info-row-main:eq(2)&&Text'); // 状态（更新至...）
        VOD.vod_content = pdfh(html, '.detail-desc&&Text'); // 简介

        // 播放列表
        let tabs = pdfa(html, '.source-item-label'); // 线路标签
        let lists = pdfa(html, '.episode-list'); // 所有集数列表容器
        let playFrom = []; // 线路来源
        let playList = []; // 播放列表

        for (let i = 0; i < tabs.length; i++) {
            let $list = $(lists[i]);
            let from = pdfh(tabs[i], 'Text'); // 线路名
            let urls = [];
            $list.find('a').each((idx, a) => {
                let title = pdfh(a, 'Text');
                let href = pd(a, 'href', input);
                urls.push(title + '$' + href);
            });
            if (urls.length > 0) {
                playFrom.push(from);
                playList.push(urls.join('#'));
            }
        }

        VOD.vod_play_from = playFrom.join('$$$');
        VOD.vod_play_url = playList.join('$$$');
        return VOD;
    },

    搜索: async function (wd, quick, pg) {
        let { input, pdfa, pdfh, pd } = this;
        let html = await request(input);
        let $ = html.html();
        let d = [];

        $('.module-search-item').each((index, el) => {
            let $item = $(el);
            d.push({
                title: pdfh($item, 'a&&Text'),
                pic_url: pd($item, 'img&&data-original'),
                desc: pdfh($item, '.video-remarks&&Text'),
                url: pd($item, 'a&&href'),
                content: pdfh($item, '.video-info-header&&Text')
            });
        });
        return setResult(d);
    },

    lazy: async function (flag, id, flags) {
        // 播放时模拟点击视频，触发真实地址加载
        let { input } = this;
        let html = await request(input);
        // 简单的懒加载处理
        return { parse: 1, url: input };
    },

    // 图片替换：根据HTML源码，核心CDN为 vf.cfaqcgj.com
    图片替换: '/vod1/vod/=>https://vf.cfaqcgj.com/vod1/vod/;/vod_pc_static_kkdy/=>https://vf.cfaqcgj.com/vod_pc_static_kkdy/',

    filter: {
        "1": [
            { "key": "类型", "name": "类型", "value": [
                { "n": "全部", "v": "" }, { "n": "动作", "v": "1" }, { "n": "喜剧", "v": "2" }, { "n": "爱情", "v": "3" },
                { "n": "科幻", "v": "4" }, { "n": "恐怖", "v": "5" }, { "n": "剧情", "v": "6" }, { "n": "战争", "v": "7" }, { "n": "纪录片", "v": "8" }
            ]},
            { "key": "地区", "name": "地区", "value": [
                { "n": "全部", "v": "" }, { "n": "大陆", "v": "大陆" }, { "n": "香港", "v": "香港" }, { "n": "台湾", "v": "台湾" },
                { "n": "美国", "v": "美国" }, { "n": "韩国", "v": "韩国" }, { "n": "日本", "v": "日本" }, { "n": "法国", "v": "法国" }, { "n": "英国", "v": "英国" }, { "n": "其他", "v": "其他" }
            ]},
            { "key": "语言", "name": "语言", "value": [
                { "n": "全部", "v": "" }, { "n": "国语", "v": "国语" }, { "n": "英语", "v": "英语" }, { "n": "粤语", "v": "粤语" },
                { "n": "闽南语", "v": "闽南语" }, { "n": "韩语", "v": "韩语" }, { "n": "日语", "v": "日语" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" },
                { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "更早", "v": "更早" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "全部", "v": "" }, { "n": "按时间", "v": "3" }, { "n": "按人气", "v": "2" }, { "n": "按评分", "v": "4" }
            ]}
        ],
        "2": "同1", // 电视剧
        "3": "同1", // 动漫
        "4": "同1", // 综艺
        "6": "同1"  // 短剧
    }
};