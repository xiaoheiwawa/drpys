/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: 'AppShark模板',
  lang: 'ds'
})
*/

// 自动生成于 7/28/2025, 3:19:20 PM
// 原始文件: AppShark[模板].js

let {
    readFileSync
} = require('fs');
let App_Path = './pz/App模板配置.json';
let App_Data = JSON.parse(readFileSync(App_Path, 'utf-8'));

function shouldRemoveLine(lineName, patterns) {
    if (!patterns || patterns.length === 0) return false;
    let lowerLine = lineName.toLowerCase();
    return patterns.some(pattern =>
        lowerLine.includes(pattern.toLowerCase())
    );
}

function shouldRemoveTitle(title, patterns) {
    if (!patterns || patterns.length === 0) return false;
    let lowerTitle = title.toLowerCase();
    return patterns.some(pattern =>
        lowerTitle.includes(pattern.toLowerCase())
    );
}
var rule = {
    类型: '影视',
    title: 'AppShark模板',
    author: 'wow',
    url: '/api.php/v1.classify/content?page=fypage',
    homeUrl: '/api.php/v1.home/data?type_id=20',
    detailUrl: '/api.php/v1.player/details?vod_id=fyid',
    searchUrl: '/api.php/v1.search/data?wd=**&type_id=0&page=fypage',
    searchable: 1,
    quickSearch: 0,
    filterable: 1,
    timeout: 5000,
    play_parse: true,
    title_remove: ['广告', '破解', '群'],
    line_remove: ['mt', '线路2', '线路3'],
    line_order: ['原画', '蓝光2', 'gz'],
    search_match: true,
    headers: {
        'User-Agent': 'aliplayer(appv=2.0.0&av=6.17.0&av2=6.17.0_44108223&os=android&ov=14&dm=22041216C)'
    },
    hostJs: async function() {
        try {
            rule.params = ungzip(rule.params);
        } catch (e) {
            console.log(`ungzip解密失败: ${e.message}`);
        }
        let _url = rule.params.split('$')[0];
        //  let html = await request(_url);
        let params = rule.params || {};
        //  let json = JSON.parse(html).AppShark;
        let json = App_Data.AppShark || {};
        rule.params = json[decodeURIComponent(rule.params.split('$')[1])];
        rule.headers['version'] = rule.params.version;
        let host = '';
        if (rule.params.host) {
            host = rule.params.host;
        } else {
            let hostdata = await request(rule.params.hosturl);
            host = JSON.parse(rule.decryptECB(hostdata, rule.params.key1))[0];
        }
        if (host.endsWith('/')) {
            host = host.slice(0, -1);
        }
        return host;
    },
    预处理: async function() {
        rule.from = {};
        const configs = await axios.post(`${rule.host}/shark/api.php?action=configs`, qs.stringify({
            'username': '',
            'token': ''
        }), {
            headers: {}
        });
        const data = JSON.parse(rule.decryptECB(configs.data, rule.params.key2));
        rule.playerinfos = data.playerinfos;
        rule.config_ua = data.config.ua;
        rule.hulue = data.config.hulue.split('&')[0];
    },
    class_parse: async function() {
        let types_data = await request(`${rule.host}/api.php/v1.home/types`, {
            headers: {
                ...rule.headers,
                'ua': rule.getUa()
            }
        });
        let types = JSON.parse(rule.decryptECB(types_data, rule.params.key)).data.types;
        let classes = [];
        let urls = [];
        types.forEach((item, index) => {
            if (index != 0) {
                urls.push(item.type_id);
                classes.push({
                    type_name: item.type_name,
                    type_id: item.type_id
                })
            }
        });
        let filterObj = {};
        let urlArr = urls.map(it => {
            return {
                url: `${rule.host}/api.php/v1.classify/types?type_id=${it}`,
                options: {
                    timeout: 5000,
                    headers: {
                        ...rule.headers,
                        'ua': rule.getUa()
                    }
                }
            }
        });
        let htmlArr = await batchFetch(urlArr);
        htmlArr.forEach((it, i) => {
            let data = JSON.parse(rule.decryptECB(it, rule.params.key)).data;
            filterObj[urls[i]] = Object.keys(data).map((key) => {
                if (data[key].length == 0) {
                    return null;
                }
                return {
                    key: key,
                    name: key,
                    value: data[key].map((item) => {
                        return {
                            n: item.type_name,
                            v: item.type_name
                        }
                    })
                }
            }).filter(it => it != null);
        });
        return {
            class: classes,
            filters: filterObj
        }
    },
    推荐: async function() {
        let {
            input
        } = this;
        let d = [];
        let data = await request(input, {
            headers: {
                ...rule.headers,
                'ua': rule.getUa()
            }
        });
        let verLandList = JSON.parse(rule.decryptECB(data, rule.params.key)).data.verLandList;
        verLandList.forEach(item => {
            item.vertical_lands.forEach(it => {
                d.push({
                    vod_name: it.vod_name,
                    vod_pic: it.vod_pic,
                    vod_remarks: it.vod_remarks.replace(/\\u[\dA-Fa-f]{4}/g, "").replace(/&quot;/g, ""),
                    vod_id: it.vod_id
                })
            })
        })
        return d;
    },
    一级: async function(tid, pg, filter, extend) {
        let {
            input,
            MY_CATE,
            MY_FL,
            MY_PAGE
        } = this;
        let d = [];
        let data = await post(input, {
            headers: {
                ...rule.headers,
                'ua': rule.getUa()
            },
            body: {
                "area": MY_FL.area_list || "全部地区",
                "lang": MY_FL.lang_list || "全部语言",
                "rank": MY_FL.rank_list || "最新",
                "type": MY_FL.type_list || "全部类型",
                "type_id": MY_CATE,
                "year": MY_FL.year_list || "全部年代"
            }
        });
        let list = JSON.parse(rule.decryptECB(data, rule.params.key)).data.video_list;
        list.forEach(item => {
            d.push({
                vod_name: item.vod_name,
                vod_pic: item.vod_pic,
                vod_remarks: item.vod_remarks.replace(/\\u[\dA-Fa-f]{4}/g, "").replace(/&quot;/g, ""),
                vod_id: item.vod_id
            })
        });
        return d;
    },
    二级: async function(ids) {
    let { input } = this;
    let data = await axios.get(input, {
        headers: {
            ...rule.headers,
            'ua': rule.getUa()
        }
    });
    let detail = JSON.parse(rule.decryptECB(data.data, rule.params.key)).data.detail;
    let vod = {
        vod_id: detail.vod_id,
        vod_pic: detail.vod_pic,
        vod_name: detail.vod_name,
        type_name: detail.vod_class,
        vod_remarks: detail.vod_remarks,
        vod_year: detail.vod_year,
        vod_area: detail.vod_area,
        vod_director: detail.vod_director,
        vod_actor: detail.vod_actor,
        vod_content: detail.vod_content
    };

    try {
        let playform = [];
        let playurls = [];
        let playlist = detail.play_url_list;

        // 1. 过滤需要移除的线路
        playlist = playlist.filter(item => 
            item.show && !shouldRemoveLine(item.show, rule.line_remove)
        );

        // 2. 核心修改：优化线路排序逻辑
        const getPriority = (lineName) => {
            if (!rule.line_order || !lineName) return 9999;
            const lowerLine = lineName.toLowerCase();
            
            // 完全匹配（如 line_order 中有 "蓝光2"）
            const exactMatchIndex = rule.line_order.findIndex(
                pattern => pattern.toLowerCase() === lowerLine
            );
            if (exactMatchIndex >= 0) return exactMatchIndex;

            // 部分匹配（如 line_order 有 "gz"，匹配 "GZ线路"）
            const partialMatchIndex = rule.line_order.findIndex(
                pattern => lowerLine.includes(pattern.toLowerCase())
            );
            if (partialMatchIndex >= 0) return partialMatchIndex;

            return 9999; // 未匹配的线路排在最后
        };

        // 3. 排序线路（按优先级升序）
        playlist.sort((a, b) => {
            const aPriority = getPriority(a.show);
            const bPriority = getPriority(b.show);
            return aPriority - bPriority;
        });


        // 5. 组装播放数据
        playlist.forEach(item => {
            rule.from[item.show] = item.from;
            playform.push(item.show);
            playurls.push(
                item.urls.map(it => `${it.name}$${it.url}`).join("#")
            );
        });

        vod.vod_play_from = playform.join("$$$") || '暂无资源';
        vod.vod_play_url = playurls.join("$$$") || '暂无资源$0';
    } catch (e) {
        vod.vod_play_from = '暂无资源';
        vod.vod_play_url = '暂无资源$0';
    }
    return vod;
},
    搜索: async function(wd, quick, pg) {
        let {
            input,
            KEY,
            MY_PAGE
        } = this;
        let d = [];
        let data = await request(input, {
            headers: {
                ...rule.headers,
                'ua': rule.getUa()
            }
        });
        let search_data = JSON.parse(rule.decryptECB(data, rule.params.key)).data.search_data;
        let list = search_data;
        if (rule.search_match) {
            list = list.filter(item =>
                item.vod_name &&
                new RegExp(wd, "i").test(item.vod_name)
            );
        }
        list = list.filter(item => !shouldRemoveTitle(item.vod_name, rule.title_remove));
        list.forEach(it => {
            d.push({
                vod_name: it.vod_name,
                vod_pic: it.vod_pic,
                vod_remarks: it.vod_remarks.replace(/\\u[\dA-Fa-f]{4}/g, "").replace(/&quot;/g, ""),
                vod_content: it.vod_blurb,
                vod_id: it.vod_id
            })
        })
        return d;
    },
    lazy: async function(flag, id, flags) {
        let {
            input
        } = this;
        const parseInfo = rule.playerinfos.find(it => it.playername == rule.from[flag]);
        const playerjiekou = rule.decryptECB(parseInfo.playerjiekou, rule.hulue);
        const playerua = parseInfo.playerua;
        let headers = rule.headers;
        if (playerua) {
            playerua.split('\n').forEach(line => {
                const [key, value] = line.split(': ');
                if (key && value) {
                    headers[key.trim()] = value.trim();
                }
            });
        }
        if (playerjiekou !== '') {
            if (playerjiekou.startsWith('http')) {
                const parseurl = playerjiekou + input;
                const parsedata = await request(parseurl, {
                    headers: {
                        ...rule.headers,
                        'ua': rule.getUa()
                    }
                });
                input = JSON.parse(parsedata).url;
            } else {
                const parsevod = await axios.post(`${rule.host}/shark/api.php?action=parsevod`, qs.stringify({
                    parse: playerjiekou,
                    url: input,
                    matching: ""
                }), {
                    headers: {
                        ...rule.headers,
                        'ua': rule.getUa()
                    }
                });
                const data = JSON.parse(rule.decryptECB(parsevod.data, rule.params.key));
                input = data.url;
            }
        }
        if (rule.from[flag] == 'dplayer' || rule.from[flag] == 'zydplayer') {
            input = (await axios.get(input, {
                maxRedirects: 10
            })).request.res.responseUrl;
        }
        if (!/m3u8|mp4|mkv/.test(input)) {
            input = input + '&type=m3u8';
        }
        return {
            parse: 0,
            url: input,
            header: headers
        }
    },
    decryptECB: function(data, KEY) {
        try {
            const key = CryptoJS.enc.Utf8.parse(KEY);
            const text = CryptoJS.enc.Base64.parse(data);
            return CryptoJS.AES.decrypt({
                ciphertext: text
            }, key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            }).toString(CryptoJS.enc.Utf8);
        } catch (e) {}
    },
    getUa: function() {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?';
        const random_chars = Array.from({
            length: 16
        }).reduce(acc => acc + chars[Math.floor(Math.random() * chars.length)], '');
        const ua = `${md5(rule.config_ua)}${random_chars}${md5(`a.${Date.now()}`)}`;
        return ua;
    }
};