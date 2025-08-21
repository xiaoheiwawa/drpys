/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'AppRJ[模版]',
  lang: 'dr2'
})
*/

// 自动生成于 7/21/2025, 8:34:57 AM
// 原始文件: AppRJ.js

globalThis.getSign = function() {
    const t = Math.floor(Date.now() / 1000).toString();
    const sign = CryptoJS.MD5(`7gp0bnd2sr85ydii2j32pcypscoc4w6c7g5spl${t}`).toString();
    return { t, sign };
};
globalThis.createReqOpts = function(body) {
    return {
        method: 'POST',
        body: JSON.stringify(body),
    headers: {
            'Content-Type': 'application/json'
        }
    };
};
globalThis.procList = function(list) {
    let d = [];
    list.forEach(item => {
        const title = item.vod_name || '';
        if (title && !/广告|破解|群/i.test(title)) {
            d.push({
                title: title,
                desc: (item.vod_remarks || '').trim(),
                pic_url: item.vod_pic_thumb || item.vod_pic || '',
                url: String(item.vod_id)
            });
        }
    });
    return d;
};
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
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    timeout: 5000,
    play_parse: true,
    search_match: true, //精准搜索
    cate_exclude: '网址|专题',
    hostJs: $js.toString(() => {
    log(`✅rule.params的结果: ${rule.params}`);
    
        try {
        log(`✅rule.params的结果: ${rule.params}`);
            HOST = rule.params.split('$')[0];
            let reqUrl = HOST;
            let fetchRes = request(reqUrl);
            let decRes = Decrypt(fetchRes);
            if (decRes && /^https?:\/\//i.test(decRes)) {
                HOST = decRes;
            } else if (fetchRes && /^https?:\/\//i.test(fetchRes)) {
                HOST = fetchRes;
            } else {
                HOST = reqUrl;
            }
        } catch (e) {
            HOST = rule.params.split('$')[0];
        }
        log(`✅HOST的结果: ${HOST}`);
    }),
    class_parse: $js.toString(() => {
        const { t, sign } = getSign();
        let body = {
            'sign': sign,
            'timestamp': t
        };
        let options = createReqOpts(body);
        let html = request(input, options);
        let data = JSON.parse(html).data;
        const filterMap = {
            "extend": "类型",
            "area": "地区",
            "lang": "语言",
            "year": "年份",
            "sort": "排序"
        };
        let filters = {};
        let classes = [];
        data.list.forEach(item => {
            let typeExtend = {
                extend: item.extend ,
                area: item.area ,
                lang: item.lang ,
                year: item.year ,
            };
            classes.push({
                type_name: item.type_name,
                type_id: item.type_id
            });
            let typeId = String(item.type_id);
            filters[typeId] = [];
            Object.keys(filterMap).forEach(key => {
                if (item[key] && item[key].length > 0) {
                    let values = JSON.parse(JSON.stringify(item[key]))
                        .filter(v => v && v.trim() !== "");
                    if (values.length > 0) {
                        if (!values.includes("全部")) {
                            values.unshift("全部");
                        }
                        const effectiveOptions = values.map(v => ({
                            n: v,
                            v: v === "全部" ? "" : v
                        })).filter(opt => !(opt.n === "全部" && values.length === 1));
                        if (effectiveOptions.length > 0) {
                            filters[typeId].push({
                                key: key,
                                name: filterMap[key],
                                value: effectiveOptions
                            });
                        }
                    }
                }
            });
        });
        homeObj.filter = filters;
        input = classes;
    }),
    一级: $js.toString(() => {
        const { t, sign } = getSign();
        let tid = MY_CATE;
        const pg = MY_PAGE;
        let body = {
            'type_id': tid,
            'limit': '12',
            'page': pg,
            'class': MY_FL.extend,
            'area': MY_FL.area,
            'year': MY_FL.year,
            'lang': MY_FL.lang,
            'sign': sign,
            'timestamp': t
        };
        let options = createReqOpts(body);
        let html = request(input, options);
        let data = JSON.parse(html).data;
        let d = procList(data["list"]);
        setResult(d);
    }),
    二级: $js.toString(() => {
        const { t, sign } = getSign();
        let body = {
            'vod_id': orId,
            'sign': sign,
            'timestamp': t
        };
        let options = createReqOpts(body);
        let html = request(input, options);
        let data = JSON.parse(html).data;
        let list = data;
        const vod_content = list['vod_content'].match(/[\u4e00-\u9fa5，。？！“”]+/g).join('');
        VOD = {
            vod_id: list['type_id'] || '暂无id', 
            vod_name: list['vod_name'] || '暂无名称',
            type_name: list['vod_class'] || '暂无类型',
            vod_pic: list['vod_pic_thumb'] || '暂无图片', 
            vod_remarks: list['vod_remarks'] || '暂无备注',
            vod_year: list['vod_year'] || '暂无年份', 
            vod_area: list['vod_area'] || '暂无地区',
            vod_actor: list['vod_actor'] || '暂无演员信息',
            vod_director: list['vod_director'] || '暂无导演',
            vod_content: vod_content || '暂无剧情介绍'
        };
        let playlist = list['vod_play_list'];
        let playmap = {};
        let excludeRegex = /(55)/i;
        let priorityList = ['自营D', '4K', 'SDR', '腾讯', '芒果', '优质'];
        let sortOrder = (a, b) => {
            let getPriority = s => {
                let index = priorityList.findIndex(keyword => s.includes(keyword));
                return index !== -1 ? index + 1 : 99;
            };
            return getPriority(a) - getPriority(b);
        };
        for (let i in playlist) {
            let item = playlist[i];
            let purls = item['parse_urls'];
            let form = item['title'];
            if (excludeRegex.test(form)) continue;
            if (!playmap[form]) playmap[form] = [];
            let playurl = item['urls'];
            for (let j in playurl) {
                let urlItem = playurl[j];
                if (!urlItem.url || urlItem.url.trim() === "") continue;
                let url = urlItem.url;
                let name = urlItem.name;
                playmap[form].push(
                    `${name}$${url}*${purls}`
                );
            }
        }
        for (let form in playmap) {
            if (playmap[form].length === 0) {
                delete playmap[form]; // 删除空线路
            }
        }
        let sortedForms = Object.keys(playmap).sort(sortOrder).filter(Boolean);
        VOD.vod_play_from = sortedForms.join('$$$');
        VOD.vod_play_url = sortedForms.map(form => playmap[form].join('#')).join('$$$');
        log(`✅VOD.vod_play_url的结果: ${VOD.vod_play_url}`);
        console.log('✅input的结果:', VOD.vod_play_url);
    }),
    lazy: $js.toString(() => {
    log(`✅input的结果: ${input}`);
        let [purl, parse] = input.split('*');
        let PlayRegex = /(\.mp4|\.m3u8)$/i;
        let isPlayUrl = PlayRegex.test(purl);
        let isHttpUrl = purl.startsWith('http');
        let isHttpParse = parse.startsWith('http');
        if (isHttpParse &&!parse.includes('url=')) {
            parse += parse.includes('?')? '&url=' : '?url=';
        }
        if (isPlayUrl) {
            input = { parse: 0, url: purl };
        } else if (isHttpParse) {
            try {
                let html = request(parse + purl);
                let parsedUrl = JSON.parse(html).url;
                input = /^https?:\/\//i.test(parsedUrl)
                  ? { parse: 0, url: parsedUrl }
                   : { jx: 1, parse: 1, url: purl };
            } catch (e) {
                input = { jx: 1, parse: 1, url: purl };
            }
        }
    }),
    搜索: $js.toString(() => {
        const { t, sign } = getSign();
        let wd = KEY;
        let pg = MY_PAGE;
        let body = {
            'limit': '12',
            'page': pg,
            'keyword': wd,
            'sign': sign,
            'timestamp': t
        };
        let options = createReqOpts(body);
        let html = request(input, options);
        let data = JSON.parse(html).data;
        if (rule.search_match) {
        data.list = data.list.filter(item =>
            item.vod_name && new RegExp(wd, "i").test(item.vod_name)
        );
    }
        let d = procList(data["list"]);
        setResult(d);
    })
};
