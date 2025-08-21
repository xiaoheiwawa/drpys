/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: 'Appmuou模板',
  lang: 'ds'
})
*/

// 自动生成于 7/27/2025, 3:44:27 PM
let { readFileSync } = require('fs');
let App_Path = './pz/App模板配置.json';
let App_Data = JSON.parse(readFileSync(App_Path, 'utf-8'));


var rule = {
    类型: '影视',
    title: 'Appmuou模板',
    author: 'wow',
    url: '/api.php/v1.vod',
    detailUrl: '/api.php/v1.vod/detail?vod_id=fyid',
    searchUrl: '/api.php/v1.vod?wd=**&limit=18&page=fypage',
    searchable: 1,
    quickSearch: 0,
    filterable: 1,
    timeout: 5000,
    play_parse: true,
    title_remove: ['广告', '破解', '群'],
    line_remove: ['线路1', '线路2', '线路3'],
    line_order: ['原画', '蓝光2', '蓝光3'],
    search_match: true,
    headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.105 MUOUAPP/10.8.4506.400",
        "brand-model": "22041216C",
        "app-device": "DeT3Mr5/V+BAz7f+sWKNbxBmh4nMU0VtPYWTXjUUWl4SHrYkNPP/C8/RVvJkD5zOref+Cb+MDuBut1ETgOrGnw==",
        "app-time": "1749291895",
        "sys-version": "14",
        "device": "578545e5f04dd2c5",
        "os": "Android",
        "content-type": "application/x-www-form-urlencoded",
        "app-version": "4.2.0"
    },
    hostJs: async function() {
        try {
            rule.params = ungzip(rule.params);
        } catch (e) {
            console.log(`ungzip解密失败: ${e.message}`);
        }
        let _url = rule.params.split('$')[0];
        //let html = await request(_url);
       // let json = JSON.parse(html).AppMuou;
        let json = App_Data.AppMuou || {};
        rule.params = json[decodeURIComponent(rule.params.split('$')[1])];
        rule.from = {};
        if (rule.params.host) {
            rule.jxhost = rule.params.host;
        } else {
            let hostdata = await request(rule.params.hosturl);
            rule.jxhost = hostdata.split('\n')[0].replace(/[\s\r]+/g, '');
        }
        const name = "muou";
        rule.headers['app-version'] = rule.params.version || "4.2.0";
        const timestamp = Math.floor(Date.now() / 1000);
        rule.headers['app-time'] = timestamp.toString();
        const inner_sha1 = CryptoJS.SHA1(`${timestamp}${name}`).toString();
        const outer_sha1 = CryptoJS.SHA1(`${timestamp}${inner_sha1}muouapp`).toString();
        let resp = await post(`${rule.jxhost}/app_info.php`, {
            headers: rule.headers,
            body: {
                t: timestamp,
                n: inner_sha1,
                m: outer_sha1
            }
        });
        let json1 = JSON.parse(resp);
        const data = json1.data;
        const a = json1.a;
        const e = json1.e;
        const s = json1.s;
        const data2 = rule.t(data, s, e);
        const key = CryptoJS.enc.Utf8.parse(md5(a).substring(0, 16));
        const iv = CryptoJS.enc.Utf8.parse(md5(outer_sha1).substring(0, 16));
        const result = rule.decrypt(data2, key, iv);
        let data3 = JSON.parse(result);
        rule.key = CryptoJS.enc.Utf8.parse(md5(data3.key).substring(0, 16));
        rule.iv = CryptoJS.enc.Utf8.parse(md5(data3.iv).substring(0, 16));
        rule.jxapi = data3.HBrjjg;
        return data3.HBqq;
    },
    预处理: async function() {},
    class_parse: async function() {
        let types_data = await request(`${rule.host}/api.php/v1.vod/types`, {
            headers: rule.headers
        });
        let typelist = JSON.parse(rule.decrypt(types_data)).data.typelist;
        let classes = [];
        let filterObj = {};
        typelist.forEach((it, i) => {
            classes.push({
                type_name: it.type_name,
                type_id: it.type_id
            });
            filterObj[it.type_id] = Object.keys(it.type_extend).map((key) => {
                if (!['state', 'star', 'director'].includes(key)) {
                    if (!it.type_extend[key]) {
                        return null;
                    }
                    return {
                        key: key,
                        name: key,
                        value: it.type_extend[key].split(',').map((item) => {
                            return {
                                n: item,
                                v: item
                            }
                        })
                    }
                }
            }).filter(it => it != null).concat({
                key: "by",
                name: "by",
                value: [{
                    n: "按更新",
                    v: "time"
                }, {
                    n: "按播放",
                    v: "hits"
                }, {
                    n: "按评分",
                    v: "score"
                }]
            });
        });
        return {
            class: classes,
            filters: filterObj
        }
    },
    推荐: async function() {},
    一级: async function(tid, pg, filter, extend) {
        let {input, MY_CATE ,MY_FL, MY_PAGE} = this;
        let d = [];
        let resp = await axios.get(input, {
            params: {
                "type": MY_CATE,
                "class": MY_FL.class || "",
                "area": MY_FL.area || "",
                "year": MY_FL.year || "",
                "by": MY_FL.by || "",
                "lang": MY_FL.lang || "",
                "version": MY_FL.version || "",
                "page": MY_PAGE,
                "limit": "18"
            },
            headers: rule.headers
        });
        let list = JSON.parse(rule.decrypt(resp.data)).data.list;
        list.forEach(item => {
            d.push({
                vod_name: item.vod_name,
                vod_pic: item.vod_pic,
                vod_remarks: item.vod_remarks,
                vod_id: item.vod_id
            })
        });
        return d;
    },
    二级: async function(ids) {
    let {
        input
    } = this;
    let data = await request(input, {
        headers: rule.headers
    });
    let detail = JSON.parse(rule.decrypt(data)).data;
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
        let playlist = detail.vod_play_list;

        // 过滤不需要的播放线路（修复逻辑：明确判断line存在）
        const isBadLine = (line) => {
            return rule.line_remove && line && rule.line_remove.some(pattern => 
                line.toLowerCase().includes(pattern.toLowerCase())
            );
        };

        // 播放线路排序逻辑
        const sortOrder = (a, b) => {
            const getPriority = (s) => {
                const lowerS = s.toLowerCase();
                for (let i = 0; i < rule.line_order.length; i++) {
                    if (lowerS.includes(rule.line_order[i].toLowerCase())) {
                        return i;
                    }
                }
                return rule.line_order.length; 
            };
            return getPriority(a) - getPriority(b);
        };

        if (playlist && Object.keys(playlist).length > 0) {
            // 收集所有有效线路信息
            const lines = Object.keys(playlist).map(key => {
                const lineInfo = playlist[key];
                const show = lineInfo.player_info.show;
                // 处理单线路播放地址
                const urlStr = Object.keys(lineInfo.urls).map(it => {
                    return `${lineInfo.urls[it].name}$${lineInfo.urls[it].url}`;
                }).join("#");
                return {
                    show,
                    urlStr,
                    from: lineInfo.player_info.from
                };
            })
            // 过滤不需要的线路
            .filter(line => !isBadLine(line.show))
            // 按排序规则排序
            .sort((a, b) => sortOrder(a.show, b.show));
      log(`✅lines的结果: ${JSON.stringify(lines, null, 4)}`);
            // 构建最终播放列表
            lines.forEach(line => {
                rule.from[line.show] = line.from;
                playform.push(line.show);
                playurls.push(line.urlStr);
            });
            vod.vod_play_from = playform.join("$$$");
            vod.vod_play_url = playurls.join("$$$");
        } else {
            vod.vod_play_from = '暂无资源';
            vod.vod_play_url = '暂无资源$0';
        }
    } catch (e) {
        vod.vod_play_from = '暂无资源';
        vod.vod_play_url = '暂无资源$0';
    }
    return vod;
},

    搜索: async function(wd, quick, pg) {
        let {input, KEY, MY_PAGE} = this;
        let d = [];
        let data = await request(input, {
            headers: rule.headers
        });
        let search_list = JSON.parse(rule.decrypt(data)).data.list;
        if (rule.search_match) {
            search_list = search_list.filter(item =>
                item.vod_name &&
                new RegExp(KEY, "i").test(item.vod_name)
            );
        }
        search_list.forEach(it => {
            d.push({
                vod_name: it.vod_name,
                vod_pic: it.vod_pic,
                vod_remarks: it.vod_remarks,
                vod_content: it.vod_blurb,
                vod_id: it.vod_id
            })
        })
        return d;
    },
    lazy: async function(flag, id, flags) {
        let {input} = this;
        console.log('解析类型>>>' + rule.from[flag]);
        try {
            const playerinfo = await post(`${rule.jxhost}/api.php?action=playerinfo`, {
                headers: rule.headers
            });
            const data = JSON.parse(rule.decrypt(playerinfo)).data;
            log(`✅data的结果: ${JSON.stringify(data, null, 4)}`);
            const parseInfo = data.playerinfo.find(it => it.playername == rule.from[flag]);
            log(`✅parseInfo的结果: ${parseInfo}`);
            if (parseInfo) {
                const playerjiekou = parseInfo.playerjiekou;
                log(`✅[内置解析的链接]: ${playerjiekou}`);
                const parseurl = playerjiekou + input;
                const parsedata = await request(parseurl, {
                    timeout: 10000
                });
                const parsejson = JSON.parse(parsedata);
                if (parsejson.url) {
                    input = parsejson.url;
                }
            } else {
                const parsevod = await request(`${rule.jxapi}${input}&playerkey=${rule.from[flag]}`, {
                    headers: rule.headers
                });
                if (parsevod) {
                    const data = JSON.parse(rule.decrypt(parsevod));
                    input = data.url;
                }
            }
        } catch (e) {}
        let PlayRegex = /\.m3u8|\.mp4|\.mkv/i;
        if (!PlayRegex.test(input)) {
            if (isofficial(input)) {
                return {
                    parse: 1,
                    jx: 1,
                    url: input
                }
            }
            input = input + '&type=m3u8';
        }
        return {
            parse: 0,
            url: input
        }
    },
    encrypt: function(data) {
        return CryptoJS.AES.encrypt(data, rule.key, {
            iv: rule.iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).ciphertext.toString(CryptoJS.enc.Base64);
    },
    decrypt: function(data, key, iv) {
        try {
            const text = CryptoJS.enc.Base64.parse(data);
            return CryptoJS.AES.decrypt({
                ciphertext: text
            }, (key || rule.key), {
                iv: (iv || rule.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }).toString(CryptoJS.enc.Utf8);
        } catch (e) {
            return toString(data);
        }
    },
    t: function(s, v, v1) {
        if (s !== null && s !== '') {
            const n = s.length;
            if (v < 0 || v1 < 0) {
                throw new Error("参数不能为负数");
            }
            if (v + v1 <= n) {
                return s.substring(v, n - v1);
            } else {
                return '';
            }
        }
        return s;
    }
};
function toString(data) {
    if (typeof data === 'string') {
        return data;
    } else if (typeof data === 'object') {
        return JSON.stringify(data);
    }
}
function isofficial(url) {
    let flag = new RegExp('qq\.com|iqiyi\.com|youku\.com|mgtv\.com|bilibili\.com|sohu\.com|ixigua\.com|pptv\.com|miguvideo\.com|le\.com|1905\.com|fun\.tv');
    return flag.test(url) && !/url=/.test(url);
}