/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: 'Appget[模板]',
  lang: 'ds'
})
*/

const { readFileSync } = require('fs');


let App_Path = './pz/App模板配置.json';
let App_Data = JSON.parse(readFileSync(App_Path, 'utf-8'));

async function detectApiType(host) {
    const testApis = [
        '/api.php/getappapi.index/searchList',
        '/api.php/qijiappapi.index/searchList'
    ];
    let apiType; 

    for (const api of testApis) {
        const testUrl = `${host}${api}`;
        try { 
            console.log(`[API检测] 开始检测: ${testUrl}`);
            const res = await request(testUrl, { timeout: 3000 });
            
            if (res.trim().startsWith('<')) {
                console.log(`[API检测] ${testUrl} 返回HTML，跳过`);
                continue;
            }

            let jsonRes;
            try {
                jsonRes = JSON.parse(res); 
            } catch (parseErr) {
                console.log(`[API检测] ${testUrl} JSON解析失败: ${parseErr.message}`);
                continue; 
            }

            if (!jsonRes.data) {
                console.log(`[API检测] ${testUrl} 无data字段，跳过`);
                continue;
            }

            const code = jsonRes.code;
            if (code) {
                apiType = api.includes('getappapi') ? 'getappapi' : 'qijiappapi';
                console.log(`[API检测] 成功！${testUrl} 类型: ${apiType}`);
                return apiType; 
            } else {
                console.log(`[API检测] ${testUrl} code不为0，跳过`);
            }

        } catch (err) { 
            console.log(`[API检测] ${testUrl} 请求失败: ${err.message}`);
            continue; 
        }
    }

    console.log('[API检测] 所有接口检测失败');
    return 'qijiappapi'; 
}


var rule = {
    类型: '影视',
    title: 'Appget[模板]',
    author: 'wow',
    homeUrl: '/api.php/Tapi.index/initV119',
    url: '/api.php/Tapi.index/typeFilterVodList?fyfilter',
    detailUrl: '/api.php/Tapi.index/vodDetail?vod_id=fyid',
    searchUrl: '/api.php/Tapi.index/searchList',
    loginUrl: '/api.php/Tapi.index/appLogin',
    parseUrl: "/api.php/Tapi.index/vodParse",
    mineUrl: "/api.php/Tapi.index/mineInfo",
    AdUrl: "/api.php/Tapi.index/watchRewardAd",
    VipUrl: "/api.php/Tapi.index/userBuyVip",
    verifyUrl: "/api.php/Tapi.verify/create?key=",
    filter_url: 'area={{fl.area or "全部"}}&year={{fl.year or "全部"}}&type_id=fyclass&page=fypage&sort={{fl.sort or "最新"}}&lang={{fl.lang or "全部"}}&class={{fl.class or "全部"}}',
    searchable: 1,
    quickSearch: 0,
    filterable: 1,
    timeout: 5000,
    play_parse: true,
    search_match: true,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    
    playRegex: /\.m3u8|\.mp4|\.mkv/i,
    title_remove: ['广告', '破解', '群'],
    line_remove: ['线路1', '线路2', '(4K)'],
    line_order: ['原画', '4K', '优质', '自营D', 'mr'],
    class_parse: async function() {
        const { input } = this;
        const html = await request(input, { method: 'POST', headers: this.headers });
        const data = JSON.parse(rule.decrypt(JSON.parse(html).data));
        const type_list = data.type_list;
        const classes = [];
        const filterObj = {};
        const defaultLangs = ["国语", "粤语", "英语", "韩语", "日语"];
        const defaultSorts = ["最新", "最热", "最赞"];
        const currentYear = new Date().getFullYear();
        const defaultYears = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
        const defaultFilters = [
            { key: "lang", name: "语言", list: defaultLangs },
            { key: "year", name: "年份", list: defaultYears },
            { key: "sort", name: "排序", list: defaultSorts }
        ];

        const addAllOption = (options) => [
            { n: "全部", v: "" },
            ...options.map(option => ({ n: option, v: option }))
        ];

        for (const item of type_list) {
            classes.push({ type_name: item.type_name, type_id: item.type_id });
            if (item.type_name === "全部") {
                filterObj[item.type_id] = defaultFilters.map(filter => ({
                    key: filter.key,
                    name: filter.name,
                    value: addAllOption(filter.list)
                }));
            } else {
                filterObj[item.type_id] = (item.filter_type_list || []).map((it, i) => ({
                    key: it.name,
                    name: it.name,
                    value: (it.list || []).map(it1 => ({ n: it1, v: it1 }))
                }));
            }
        }
        return { class: classes, filters: filterObj };
    },
    hostJs: async function() {
        try {
            if (rule.params) rule.params = ungzip(rule.params);
        } catch (e) {
            console.log(`[hostJs] ungzip解密失败: ${e.message}`);
        }

        const parts = (rule.params || '').split('$');
        const _host = parts[0] || '';
        rule._key = parts[1] || '';
        rule._iv = parts[2] || rule._key;
        const params = rule.params || {};
        const json = App_Data.AppGet || {};
        const paramStr = String(params || '');
        const paramKey = decodeURIComponent((paramStr.split('$')[1] || ''));
        const config = json[paramKey] || {};
        rule.key = config.key || config.dataKey || config.datakey || rule._key;
        rule.iv = rule.key || config.iv || config.dataIv || rule._iv;
        rule.username = config.username || '';
        rule.password = config.password || '';
rule.lazyheader = config.lazyheader?.length ? config.lazyheader : rule.headers;
        rule.verify = config.verify === 'true';
        rule.muban = config.muban || 'Appget';
        const hostUrl = config 
            ? (config.host || config.hosturl || config.url || config.site || _host) 
            : _host;
        if (!hostUrl) {
            console.warn('[hostJs] hostUrl为空，无法发起请求');
            return '';
        }
        let host = '';
        let hostData = await request(hostUrl);
        if (hostData) {
            let firstLine = hostData.split('\n')[0].replace(/[\s\r]+/g, '');
            if (/^https?:\/\//i.test(firstLine)) {
                host = firstLine;
            } else {
                host = hostUrl;
            }
        } else {
            host = hostUrl;
        }
        if (host.endsWith('/')) {
            host = host.slice(0, -1);
        }
        return host;
    },
    预处理: async function() {
        console.log('[预处理] 开始API类型检测...');
        rule.apiType = await detectApiType(rule.host);
        
        if (!rule.apiType) {
            rule.apiType = rule.muban === 'Appget' ? 'getappapi' : 'qijiappapi';
            console.log(`[预处理] 未检测到API类型，使用默认值: ${rule.apiType}`);
        } else {
            console.log(`[预处理] 最终API类型: ${rule.apiType}`);
        }

        const apiPaths = [
            'url', 'searchUrl', 'detailUrl', 'homeUrl', 'parseUrl',
            'mineUrl', 'AdUrl', 'VipUrl', 'loginUrl', 'verifyUrl'
        ];
        apiPaths.forEach(path => {
            rule[path] = rule[path].replace(/Tapi/g, rule.apiType);
            console.log(`[预处理] 更新接口路径 ${path}: ${rule[path]}`);
        });

        if (rule.username && rule.password) {
            try {
                const data = await request(`${rule.loginUrl}`, {
                    method: 'POST',
                    headers: rule.headers,
                    body: `password=${rule.password}&code=&device_id=&user_name=${rule.username}&invite_code=&key=&is_emulator=0`
                });
                const userInfo = JSON.parse(rule.decrypt(JSON.parse(data).data)).user;
                rule.headers['app-user-token'] = userInfo.auth_token;
                console.log('[预处理] 登录成功，已添加token');
            } catch (e) {
                console.log('[预处理] 登录错误:', e.message);
            }
        }
    },
    一级: async function(tid, pg, filter, extend) {
        const { input, MY_CATE, MY_FL, MY_PAGE } = this;
        const d = [];
        const html = await request(input, { method: 'POST', headers: rule.headers });
        const html1 = rule.decrypt(JSON.parse(html).data);
        const list = JSON.parse(html1).recommend_list;
        list.forEach(item => {
            let title = item.vod_name;
            let isBadTitle = rule.title_remove && rule.title_remove.some(word =>
                new RegExp(word, 'i').test(title)
            );
            if (!isBadTitle) {
                d.push({
                    title: title,
                    desc: item.vod_remarks,
                    pic_url: item.vod_pic,
                    url: item.vod_id,
                });
            }
        });
        return setResult(d);
    },
    二级: async function(ids) {
    const { input } = this;
    try {
        // 处理会员时长参数（若存在）
        if (!rule.会员时长 && rule.params['会员时长']) {
            eval('rule.会员时长 = ' + ungzip(rule.params['会员时长']));
        }

        // 会员登录状态校验与处理
        if (rule.username && rule.password) {
            // 获取用户信息
            let mineInfo = await request(rule.mineUrl, { 
                method: 'POST', 
                headers: rule.headers 
            });
            mineInfo = JSON.parse(rule.decrypt(JSON.parse(mineInfo).data));

            // 若用户信息缺失，执行预处理后重新获取
            if (!mineInfo.user) {
                await rule.预处理();
                mineInfo = await request(rule.mineUrl, { 
                    method: 'POST', 
                    headers: rule.headers 
                });
                mineInfo = JSON.parse(rule.decrypt(JSON.parse(mineInfo).data));
            }

            // 会员状态判断与处理
            if (mineInfo.user?.is_vip) {
                console.log('[二级处理] 会员到期时间:' + new Date(mineInfo.user.user_end_time * 1000).toLocaleString());
            } else if (rule.会员时长) {
                await rule.会员时长(mineInfo);
                await rule.预处理();
            }
        }
    } catch (e) {
        console.error('[二级处理] 会员/登录流程出错，继续执行:', e.message);
    }

    // 获取并解析播放列表数据
    const html = await request(input, { method: 'POST', headers: rule.headers });
    const json = JSON.parse(rule.decrypt(JSON.parse(html).data));
    const vod = json.vod;

    let playlist = json['vod_play_list'];
    const playmap = {}; // 存储格式化后的播放线路与地址
    const playform = []; // 播放线路名称列表
    const playurls = []; // 播放地址列表

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

    // 解析播放列表并填充playmap
    for (let i in playlist) {
            let item = playlist[i];
            let playinfo = item['player_info'];
            let parse = playinfo['parse'];
            let player_parse_type = playinfo['player_parse_type'];
            let parse_type = playinfo['parse_type'];
            let form = playinfo['show'];

            // 使用修复后的过滤函数
            if (isBadLine(form)) continue;

            if (!playmap[form]) playmap[form] = [];
            let playurl = item['urls'];
            for (let j in playurl) {
                let urlItem = playurl[j];
                if (!urlItem.url || urlItem.url.trim() === "") continue;
                let url = urlItem.url;
                let name = urlItem.name;
                let token = urlItem.token;
                playmap[form].push(
                    `${name}$${url}*${parse}*token=${token}*${player_parse_type}*${parse_type}`
                );
            }
        }
        for (let form in playmap) {
            if (playmap[form].length === 0) {
                delete playmap[form];
            }
        }
        let sortedForms = Object.keys(playmap).sort(sortOrder).filter(Boolean);
        vod.vod_play_from = sortedForms.join('$$$');
        vod.vod_play_url = sortedForms.map(form => playmap[form].join('#')).join('$$$');


    return vod;
},

    搜索: async function(wd, quick, pg) {
        const { input, KEY, MY_PAGE } = this;
        const d = [];
        try {
            const body = `keywords=${KEY}&type_id=0&page=${MY_PAGE}`;
            if (rule.verify) {
                return await verifySearch(body);
            }

            const data = await request(input, {
                method: 'POST',
                headers: rule.headers,
                body
            });
            const json = JSON.parse(data);
            if (json.code === 0) console.log(`[搜索] 提示: ${json.msg}`);
            
            let list = JSON.parse(rule.decrypt(json.data)).search_list;
            if (rule.search_match) {
                list = list.filter(item => item.vod_name && 
                    new RegExp(KEY, "i").test(item.vod_name)
                );
            }
            return list
        } catch (e) {
            const search = `${rule.host}/index.php/ajax/suggest?mid=1&wd=${KEY}&limit=20`;
            const submitHtml = await request(search);
            const responseData = JSON.parse(submitHtml);
            let list = responseData.list || [];
            if (rule.search_match) {
            list = list.filter(item => {
            const name = item.name;
            return name && name.includes(KEY);
         });
    }
            list.forEach(it => {
                d.push({
                    title: it.name,
                    url: it.id,
                    pic_url: it.pic,
                });
            });
            return setResult(d);
        }
    },
    lazy: async function(flag, id, flags) {
        const { input } = this;
        const [purl, parse, tokenPart] = input.split('*');
        const token = tokenPart?.replace('token=', '') || '';
        const headers = rule.lazyheader ? rule.lazyheader : rule.headers;
        const isPlayUrl = rule.playRegex.test(purl);
        const isHttpParse = parse?.startsWith('http') || false;

        if (isHttpParse && !parse.includes('url=')) {
            parse += parse.includes('?') ? '&url=' : '?url=';
        }

        console.log(`[播放处理] 处理链接: ${purl}`);
        try {
            if (isPlayUrl) {
                console.log(`[播放处理] 直接播放: ${purl}`);
                return { url: purl, parse: 0, header: headers };
            } else if (isHttpParse) {
                console.log(`[播放处理] 解析播放: ${parse + purl}`);
                const html = await request(parse + purl);
                const parsedUrl = JSON.parse(html).url  || '';
                if (parsedUrl) {
                const jxUrl = await checkVideoLink(parsedUrl) || '';
                log(`[内置解析的链接]: ${parse}`);
                log(`[内置解析的结果]: ${jxUrl.valid}`);
                return {
                    parse: 0,
                    url: parsedUrl,
                } 
               }else  {
               return {
                    jx: 1,
                    parse: 1,
                    url: purl,
                    header: headers
                    }
                };
            } else {
                console.log(`[播放处理] 解密播放: ${purl}`);
                const encryptedUrl = rule.encrypt(purl);
                const formDatas = [
                    `parse_api=${parse}&url=${encodeURIComponent(encryptedUrl)}&token=${token}`,
                    `parse_api=${parse}&url=${encryptedUrl}&token=${token}`
                ];
                const apiUrl = `${rule.host}${rule.parseUrl}`;

                for (const formData of formDatas) {
                    try {
                        const html = await request(apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
                            body: formData
                        });
                        const data = JSON.parse(html).data;
                        if (data && !(Array.isArray(data) && !data.length)) {
                            const jdata = rule.decrypt(data);
                            const outerData = JSON.parse(jdata);
                            const innerData = JSON.parse(outerData.json);
                            log(`[解密的结果]: ${JSON.stringify(innerData, null, 4)}`);
                            const jxUrl = await checkVideoLink(innerData.url);
                            return jxUrl.valid ? {
                                parse: 0,
                                url: innerData.url,
                                header: headers
                            } : {
                                parse: 1,
                                jx: 1,
                                url: purl,
                                header: headers
                            };
                        }
                    } catch (e) {
                        console.log(`[播放处理] 加密解析错误: ${e.message}`);
                    }
                }
            }
        } catch (e) {
            console.log(`[播放处理] 错误: ${e.message}`);
            return { parse: 0, url: purl, header: headers };
        }
    },
    encrypt: function(word) {
        const key = CryptoJS.enc.Utf8.parse(rule.key);
        const iv = CryptoJS.enc.Utf8.parse(rule.iv);
        const srcs = CryptoJS.enc.Utf8.parse(word);
        const encrypted = CryptoJS.AES.encrypt(srcs, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const encryptedStr = encrypted.toString(CryptoJS.enc.base64);
    return encryptedStr.toString();
},
    decrypt: function(word) {
        const key = CryptoJS.enc.Utf8.parse(rule.key);
        const iv = CryptoJS.enc.Utf8.parse(rule.iv);
        const decrypted = CryptoJS.AES.decrypt(word, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
       return decryptedStr.toString();
}
};

async function checkVideoLink(url) {
    try {
        let response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'Range': 'bytes=0-1'
            },

            validateStatus: function(status) {
                return status === 200 || status === 206;
            }
        });
        return {
            valid: true,
            status: response.status,
            serverSupportsPartial: response.status === 206,
            contentLength: response.headers['content-length']
        };
    } catch (error) {
        if (error.response) {
            return {
                valid: false,
                status: error.response.status,
                error: `Server responded with ${error.response.status}`,
                serverError: true
            };
        } else if (error.request) {
            return {
                valid: false,
                error: 'No response from server',
                connectionError: true
            };
        } else {
            return {
                valid: false,
                error: error.message
            };
        }
    }
}

function isofficial(url) {
    let flag = new RegExp('qq\.com|iqiyi\.com|youku\.com|mgtv\.com|bilibili\.com|sohu\.com|ixigua\.com|pptv\.com|miguvideo\.com|le\.com|1905\.com|fun\.tv');
    return flag.test(url) && !/url=/.test(url);
}

function generateUUID() {
    let randomBytes = CryptoJS.lib.WordArray.random(16);
    let hexString = randomBytes.toString(CryptoJS.enc.Hex);
    return (
        hexString.substr(0, 8) + "-" +
        hexString.substr(8, 4) + "-" +
        "4" + hexString.substr(12, 3) + "-" +
        (parseInt(hexString.substr(16, 1), 16) & 0x3 | 0x8).toString(16) +
        hexString.substr(17, 3) + "-" +
        hexString.substr(20, 12)
    );
}

function generateDeviceId() {
    let randomBytes = CryptoJS.lib.WordArray.random(17);
    let hexString = randomBytes.toString(CryptoJS.enc.Hex);
    return hexString.substring(0, 33);
}

async function verifySearch(body, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            let key = generateUUID();
            let baseImg = await request(`${rule.host}/${rule.verifyUrl}${key}`, {
                buffer: 2
            });
            let resp = await post(OCR_API, {
                headers: {
                    "Content-Type": "text/plain;charset=UTF-8",
                },
                body: baseImg
            });
            let data = await post(`${rule.searchUrl}`, {
                headers: rule.headers,
                body: `${body}&code=${resp}&key=${key}`
            });
            let json = JSON.parse(data);
            if (json.code !== 1) {
                console.log(`验证失败（${attempt}${maxAttempts}）: ${json.msg}`);
                continue;
            }
            console.log(`验证成功（${attempt}${maxAttempts}）: ${json.msg}`);
            return JSON.parse(rule.decrypt(json.data)).search_list;
        } catch (error) {
            console.log(`请求异常（${attempt}${maxAttempts}）: ${error.message}`);
        }
    }
    console.log('验证失败');
    return [];
}


