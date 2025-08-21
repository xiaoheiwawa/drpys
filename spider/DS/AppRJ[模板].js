/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'AppRJ[模版]',
  lang: 'ds'
})
*/

let { readFileSync } = require('fs');
let App_Path = './pz/App模板配置.json';
let App_Data = JSON.parse(readFileSync(App_Path, 'utf-8'));

globalThis.getSign = () => {
    let t = Math.floor(Date.now() / 1000).toString();
    let sign = CryptoJS.MD5(`7gp0bnd2sr85ydii2j32pcypscoc4w6c7g5spl${t}`).toString();
    return { t, sign };
};

globalThis.createReqOpts = (body) => ({
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
});

var rule = {
    类型: '影视',
    host: '',
    title: 'AppRJ[模版]',
    desc: 'AppRJ[模版]',
    homeUrl: '/v3/type/top_type',
    url: '/v3/home/type_search',
    detailUrl: '/v3/home/vod_details',
    searchUrl: '/v3/home/search',
    searchable: 1,
    filterable: 1,
    quickSearch: 1,
    headers: { 'User-Agent': 'MOBILE_UA' },
    timeout: 5000,
    play_parse: true,
    search_match: true,
    cate_exclude: '网址|专题',
    title_remove: ['广告', '破解', '群'],
    line_remove: ['线路1', '线路2', '线路3'],
    line_order: ['原画', '蓝光', '蓝光3'],

    hostJs: async function () {
        try { rule.params = ungzip(rule.params); } 
        catch (e) { console.log(`ungzip失败: ${e.message}`); }
        
        let [_host, paramKey] = (rule.params || '').split('$').map(v => v || '');
        let json = App_Data.AppRJ || {};
        let config = json[decodeURIComponent(paramKey)] || {};
        
        Object.assign(rule, {
            username: config.username || '',
            password: config.password || '',
            lazyheader: config.lazyheader || {},
            verify: config.verify === 'true',
            muban: config.muban || 'AppRJ'
        });

        let hostUrl = config.site || config.host || config.hosturl || config.url || _host;
        let hostData = await request(hostUrl).catch(() => '');
        let firstLine = hostData.split('\n')[0]?.replace(/[\s\r]+/g, '') || '';
        let host = /^https?:\/\//i.test(firstLine) ? firstLine : hostUrl;
        
        return host.endsWith('/') ? host.slice(0, -1) : host;
    },

    class_parse: async function () {
        let { t, sign } = getSign();
        let html = await request(this.input, createReqOpts({ sign, timestamp: t }));
        let data = JSON.parse(html).data || { list: [] };
        let filterMap = { extend: '类型', area: '地区', lang: '语言', year: '年份', sort: '排序' };
        let classes = [], filters = {};

        data.list.forEach(item => {
            classes.push({ type_name: item.type_name, type_id: item.type_id });
            let typeId = String(item.type_id);
            filters[typeId] = Object.keys(filterMap).reduce((res, key) => {
                let values = (item[key] || []).filter(v => v?.trim());
                if (!values.length) return res;
                if (!values.includes('全部')) values.unshift('全部');
                let opts = values.map(v => ({ n: v, v: v === '全部' ? '' : v }))
                    .filter(opt => !(opt.n === '全部' && values.length === 1));
                opts.length && res.push({ key, name: filterMap[key], value: opts });
                return res;
            }, []);
        });

        return { class: classes, filters };
    },

    一级: async function () {
        let { MY_CATE, MY_PAGE, MY_FL } = this;
        let { t, sign } = getSign();
        let body = {
            type_id: MY_CATE,
            limit: '12',
            page: MY_PAGE,
            class: MY_FL.extend,
            area: MY_FL.area,
            year: MY_FL.year,
            lang: MY_FL.lang,
            sign,
            timestamp: t
        };
        let html = await request(this.input, createReqOpts(body));
        let list = (JSON.parse(html).data || {}).list || [];
        let removePatterns = this.title_remove || [];

        return setResult(list.filter(item => {
            let title = item.vod_name || '';
            return title && !removePatterns.some(p => title.includes(p));
        }).map(item => ({
            title: item.vod_name,
            desc: (item.vod_remarks || '').trim(),
            pic_url: item.vod_pic_thumb || item.vod_pic || '',
            url: String(item.vod_id)
        })));
    },

    二级: async function () {
        let { orId } = this;
        let { t, sign } = getSign();
        let html = await request(this.input, createReqOpts({ vod_id: orId, sign, timestamp: t }));
        let data = JSON.parse(html).data || {};

        // 基础信息
        let VOD = {
            vod_id: data.vod_id || '暂无id',
            vod_name: data.vod_name || '暂无名称',
            type_name: data.vod_class || '暂无类型',
            vod_pic: data.vod_pic_thumb || data.vod_pic || '',
            vod_remarks: data.vod_remarks || '',
            vod_year: data.vod_year || '',
            vod_area: data.vod_area || '',
            vod_actor: data.vod_actor || '',
            vod_director: data.vod_director || '',
            vod_content: (data.vod_content || '暂无剧情').match(/[\u4e00-\u9fa5，。？！“”]+/g)?.join('') || ''
        };

        // 播放线路处理
        let playlist = data.vod_play_list || [];
        let playmap = {};

        // 过滤线路
        const isBadLine = (line) => this.line_remove?.some(p => line?.toLowerCase().includes(p.toLowerCase()));
        // 排序线路
        const sortOrder = (a, b) => {
            const getPrio = (s) => {
                let lower = s.toLowerCase();
                for (let i = 0; i < this.line_order.length; i++) {
                    if (lower.includes(this.line_order[i].toLowerCase())) return i;
                }
                return this.line_order.length;
            };
            return getPrio(a) - getPrio(b);
        };

        // 处理有效线路
        playlist.filter(item => !isBadLine(item.title))
            .sort((a, b) => sortOrder(a.title, b.title))
            .forEach(item => {
                let form = item.title;
                let urls = (item.urls || []).filter(u => u.url?.trim());
                playmap[form] = urls.map((u, i) => 
                    `${u.name || `第${i+1}集`}$${u.url}*${item.parse_urls || ''}`
                );
            });

        // 组装播放源
        let sortedForms = Object.keys(playmap);
        VOD.vod_play_from = sortedForms.join('$$$') || '暂无资源';
        VOD.vod_play_url = sortedForms.map(f => playmap[f].join('#')).join('$$$') || '暂无资源$0';

        return VOD;
    },

    lazy: async function(flag, id, flags) {
    let { input } = this;
    let [purl, parse = ''] = input.split('*');
    let isHttpParse = parse.startsWith('http');
    let parseApis = parse.split(',').map(api => api.trim());

    try {
        if (isHttpParse) {
            for (let api of parseApis) {
                try {
                    let parseUrl = api.includes('url=') 
                        ? api 
                        : `${api}${api.includes('?') ? '&' : '?'}url=`;
                    log(`尝试解析接口: ${parseUrl + purl}`);
                    let html = await request(parseUrl + purl);
                    let { url: parsedUrl } = JSON.parse(html) || {};
                    if (parsedUrl && /^https?:\/\//i.test(parsedUrl)) {
                        return { parse: 0, url: parsedUrl };
                    }
                } catch (e) {
                    log(`解析接口失败: ${api}, 错误: ${e.message}`);
                    continue;
                }
            }
            log(`所有解析接口均失败，返回原始URL`);
            return { jx: 1, parse: 1, url: purl };
        } else if (/m3u8|mp4|mkv/i.test(purl)) {
            log(`直接播放链接: ${purl}`);
            return { parse: 0, url: purl };
        } else {
            log(`未知解析类型，返回原始URL`);
            return { parse: 0, url: purl };
        }
    } catch (e) {
        log(`解析过程发生错误: ${e.message}`);
        return { parse: 0, url: purl };
    }
},


    搜索: async function () {
        let { KEY, MY_PAGE } = this;
        let { t, sign } = getSign();
        let html = await request(this.input, createReqOpts({
            limit: '12',
            page: MY_PAGE,
            keyword: KEY,
            sign,
            timestamp: t
        }));
        let list = (JSON.parse(html).data || {}).list || [];

        // 精准搜索过滤
        if (this.search_match) {
            list = list.filter(item => item.vod_name?.match(new RegExp(KEY, 'i')));
        }

        return setResult(list.map(item => ({
            title: item.vod_name || '',
            desc: (item.vod_remarks || '').trim(),
            pic_url: item.vod_pic_thumb || item.vod_pic || '',
            url: String(item.vod_id)
        })));
    }
};
