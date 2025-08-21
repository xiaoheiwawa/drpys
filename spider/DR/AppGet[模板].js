/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'AppGet[兼容版]',
  lang: 'dr2'
})
*/

// 自动生成于 7/25/2025, 2:56:50 AM
// 原始文件: AppGet[模板].js

globalThis.Decrypt = function(word) {
    let key = CryptoJS.enc.Utf8.parse(rule.key);
    let iv = CryptoJS.enc.Utf8.parse(rule.iv);
    let decrypt = CryptoJS.AES.decrypt(word, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
}
globalThis.Encrypt = function(word) {
    let key = CryptoJS.enc.Utf8.parse(rule.key);
    let iv = CryptoJS.enc.Utf8.parse(rule.iv);
    let encrypt = CryptoJS.AES.encrypt(word, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    let encryptedStr = encrypt.toString(CryptoJS.enc.base64);
    return encryptedStr.toString();
}
globalThis.cleanVerificationCode = function(text) {
    let replacements = {
        'y': '9',
        '口': '0',
        'q': '0',
        'u': '0',
        'o': '0',
        '>': '1',
        'd': '0',
        'b': '8',
        '已': '2',
        'D': '0',
        '五': '5',
        '066': '1666',
        '566': '5066'
    };
    if (text.length === 3) {
        text = text.replace('566', '5066').replace('066', '1666');
    }
    return text.split('').map(char =>
        replacements[char] || char
    ).join('');
}
globalThis.generateUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0;
        let v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
globalThis.detectApiType = function(host) {
    let testApis = [
        '/api.php/getappapi.index/initV119',
        '/api.php/qijiappapi.index/initV119'
    ];
    let apiType = 'getappapi';
    for (let i = 0; i < testApis.length; i++) {
        let api = testApis[i];
        let testUrl = host + api;
        let res;
        try {
            res = request(testUrl, {
                timeout: 3000
            });
        } catch (e) {
            continue;
        }
        if (res.trim().startsWith('<')) {
            continue;
        }
        let jsonRes;
        try {
            jsonRes = JSON.parse(res);
        } catch (e) {
            continue;
        }
        try {
            let decryptedData = Decrypt(jsonRes.data);
            let parsedData = JSON.parse(decryptedData);
            if (parsedData.recommend_list || parsedData.type_list) {
                apiType = api.includes('getappapi') ? 'getappapi' : 'qijiappapi';
                break;
            }
        } catch (e) {
            continue;
        }
    }
    log(`✅apiType的结果: ${apiType}`);
    return apiType;
}
var rule = {
    类型: '影视',
    host: '',
    title: 'AppGet[兼容版]',
    desc: '自动适配双API模板',
    homeUrl: '/api.php/Tapi.index/initV119',
    url: '/api.php/Tapi.index/typeFilterVodList?fyfilter',
    detailUrl: '/api.php/Tapi.index/vodDetail?vod_id=fyid',
    filter_url: 'area={{fl.area or "全部"}}&year={{fl.year or "全部"}}&type_id=fyclass&page=fypage&sort={{fl.sort or "最新"}}&lang={{fl.lang or "全部"}}&class={{fl.class or "全部"}}',
    searchUrl: '/api.php/Tapi.index/searchList',
    searchable: 1,
    filterable: 1,
    quickSearch: 1,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 5000,
    play_parse: true,
    search_match: true,
    cate_exclude: '网址|专题',

    // 过滤配置改为数组形式
    title_remove: ['广告', '破解', '群'], // 标题过滤
    line_remove: ['线路1', '线路2', '线路3'], // 线路过滤
    line_order: ['蓝光1', '蓝光2', '蓝光3'],

    hostJs: $js.toString(() => {
        try {
            HOST = rule.params.split('$')[0];
            let reqUrl = HOST;
            let fetchRes = request(reqUrl);
            if (fetchRes && /^https?:\/\//i.test(fetchRes)) {
                HOST = fetchRes;
                log(`✅HOST23的结果: ${HOST}`);
            } else {
                HOST = reqUrl;
            }
        } catch (e) {
            HOST = rule.params.split('$')[0];
        }
        log(`✅HOST的结果: ${HOST}`);

    }),

    预处理: $js.toString(() => {
        let parts = rule.params.split('$');
        let _host = parts[0];
        rule.key = parts[1];
        rule.iv = (parts[2] ? parts[2].split('@')[0] : rule.key) || rule.key;
        rule.apiType = detectApiType(HOST);
        let apiPaths = ['url', 'searchUrl', 'detailUrl', 'homeUrl'];
        apiPaths.forEach(path => {
            let oldUrl = rule[path];
            rule[path] = oldUrl.replace(/Tapi/g, rule.apiType);
        });
    }),

    class_parse: $js.toString(() => {
        log(`✅input的结果: ${input}`);
        let html = request(input);
        let html1 = Decrypt(JSON.parse(html).data);
        let list = JSON.parse(html1);
        let data = list;
        let filterMap = {
            "class": "类型",
            "area": "地区",
            "lang": "语言",
            "year": "年份",
            "letter": "字母",
            "sort": "排序"
        };
        let filters = {};
        let classes = [];
        let json_data = data["type_list"];
        for (let item of json_data) {
            let typeExtendStr = item["type_extend"] || "{}";
            let typeExtend;
            try {
                typeExtend = JSON.parse(typeExtendStr);
            } catch (e) {
                console.error("解析分类扩展信息失败:", typeExtendStr);
                typeExtend = {};
            }
            let defaultLangs = ["国语", "粤语", "英语", "韩语", "日语"];
            let originalLangs = (typeExtend.lang || "").split(",").map(l => l.trim()).filter(l => l);
            let mergedLangs = originalLangs.concat(defaultLangs).filter((item, index, arr) => arr.indexOf(item) === index);
            typeExtend.lang = mergedLangs.join(",");
            let currentYear = new Date().getFullYear();
            let defaultYears = Array.from({
                length: 20
            }, (_, i) => currentYear - i);
            if (!typeExtend.year || typeExtend.year.trim() === "") {
                typeExtend.year = defaultYears.join(',');
            } else {
                var originalYears = typeExtend.year.split(',')
                    .map(function(y) {
                        return parseInt(y.trim(), 10);
                    })
                    .filter(function(y) {
                        return !isNaN(y);
                    });
                typeExtend.year = defaultYears.join(',');
            }
            typeExtend["sort"] = "最新,最热,最赞";
            classes.push({
                "type_name": item["type_name"],
                "type_id": item["type_id"]
            });
            let typeId = String(item["type_id"]);
            filters[typeId] = [];
            for (let key in typeExtend) {
                if (key in filterMap && typeof typeExtend[key] === "string" && typeExtend[key].trim()) {
                    let values = typeExtend[key].split(",").map(v => v.trim()).filter(v => v);
                    let options = [{
                        "n": "全部",
                        "v": ""
                    }].concat(
                        values.map(v => ({
                            "n": v.trim(),
                            "v": v.trim()
                        }))
                    );
                    filters[typeId].push({
                        key: key,
                        name: filterMap[key],
                        value: options
                    });
                }
            }
        }
        homeObj.filter = filters;
        input = classes;
    }),

    一级: $js.toString(() => {
        let d = [];
        let html = request(input);
        let html1 = Decrypt(JSON.parse(html).data);
        let list = JSON.parse(html1).recommend_list;
        list.forEach(item => {
            let title = item.vod_name || '';
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
        setResult(d);
    }),

    二级: $js.toString(() => {
        let html = request(input);
        let html1 = Decrypt(JSON.parse(html).data);
        let list = JSON.parse(html1);
        VOD = {
            vod_id: list['vod']['vod_id'] || '暂无id',
            vod_name: list['vod']['vod_name'] || '暂无名称',
            type_name: list['vod']['vod_class'] || '暂无类型',
            vod_pic: list['vod']['vod_pic'] || '暂无图片',
            vod_remarks: list['vod']['vod_remarks'] || '暂无备注',
            vod_year: list['vod']['vod_year'] || '暂无年份',
            vod_area: list['vod']['vod_area'] || '暂无地区',
            vod_actor: list['vod']['vod_actor'] || '暂无演员信息',
            vod_director: list['vod']['vod_director'] || '暂无导演',
            vod_content: list['vod']['vod_content'] || '暂无剧情介绍'
        };
        let playlist = list['vod_play_list'];
        let playmap = {};

        // 修复线路过滤函数：补充数组调用和字符串方法的调用对象
        let isBadLine = (line) =>
            rule.line_remove && rule.line_remove.some(pattern =>
                line && line.toLowerCase().includes(pattern.toLowerCase())
            );

        let sortOrder = (a, b) => {
            let getPriority = s => {
                s = s.toLowerCase();
                for (let i = 0; i < rule.line_order.length; i++) {
                    if (s.includes(rule.line_order[i].toLowerCase())) {
                        return i;
                    }
                }
                return rule.line_order.length; 
            };
            return getPriority(a) - getPriority(b);
        };

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
        VOD.vod_play_from = sortedForms.join('$$$');
        VOD.vod_play_url = sortedForms.map(form => playmap[form].join('#')).join('$$$');
    }),


    lazy: $js.toString(() => {
        let [purl, parse, tokenPart] = input.split('*');
        let token = tokenPart.replace('token=', '');
        let PlayRegex = /(\.mp4|\.m3u8)$/i;
        let isPlayUrl = PlayRegex.test(purl);
        let isHttpUrl = purl.startsWith('http');
        let isHttpParse = parse.startsWith('http');
        log(`✅parse的结果: ${parse}`);
        if (isHttpParse && !parse.includes('url=')) {
            parse += parse.includes('?') ? '&url=' : '?url=';
        }
        log(`✅6parse的结果: ${parse}`);
        if (isPlayUrl) {
            input = {
                parse: 0,
                url: purl
            };
        } else if (isHttpParse) {
            try {
                let html = request(parse + purl);
                let parsedUrl = JSON.parse(html).url;
                input = /^https?:\/\//i.test(parsedUrl) ? {
                    parse: 0,
                    url: parsedUrl
                } : {
                    jx: 1,
                    parse: 1,
                    url: purl
                };
            } catch (e) {
                input = {
                    jx: 1,
                    parse: 1,
                    url: purl
                };
            }
        } else {
            let encryptedUrl = Encrypt(purl);
            let formDatas = [
                `parse_api=${parse}&url=${encodeURIComponent(encryptedUrl)}&token=${token}`,
                `parse_api=${parse}&url=${encryptedUrl}&token=${token}`
            ];
            let apiUrl = rule.host + `/api.php/${rule.apiType}.index/vodParse`;
            let inputData;
            for (let i = 0; i < formDatas.length; i++) {
                let options = {
                    method: 'POST',
                    body: formDatas[i]
                };
                try {
                    let html = request(apiUrl, options);
                    let data = JSON.parse(html).data;
                    if (data && !(Array.isArray(data) && data.length === 0)) {
                        let jdata = Decrypt(data);
                        let outerData = JSON.parse(jdata);
                        let innerData = JSON.parse(outerData.json);
                        input = {
                            parse: 0,
                            url: innerData.url
                        };
                        break;
                    }
                } catch (e) {
                    if (i === formDatas.length - 1) {
                        input = {
                            jx: 1,
                            parse: 1,
                            url: purl
                        };
                    }
                }
            }
        }
    }),
    搜索: $js.toString(() => {
        let wd = KEY;
        let pg = MY_PAGE;
        try {
            let randomUUID = generateUUID();
            let verifyUrl = `${HOST}/api.php/${rule.apiType}.verify/create?key=${randomUUID}`;
            log(`✅verifyUrl的结果: ${verifyUrl}`);
            let yzmResponse = request(verifyUrl, {
                withHeaders: true,
                toBase64: true,
                headers: rule.headers
            }, true);
            let yzmJson = JSON.parse(yzmResponse);
            let ocrResult = post('https://api.nn.ci/ocr/b64/text', {
                body: yzmJson.body
            });
            let cleanCode = cleanVerificationCode(ocrResult);
            let formData = `keywords=${wd}&type_id=0&page=${pg}&code=${cleanCode}&key=${randomUUID}`;
            let options = {
                method: 'POST',
                body: formData
            };
            let submitHtml = request(input, options, true);
            let d = [];
            let responseData = JSON.parse(submitHtml);
            let html = Decrypt(responseData.data);
            let searchData = JSON.parse(html);
            let list = searchData.search_list;
            if (rule.search_match) {
                list = list.filter(item =>
                    item.vod_name &&
                    new RegExp(wd, "i").test(item.vod_name)
                );
            }
            list.forEach(it => {
                d.push({
                    title: it.vod_name,
                    url: it.vod_id,
                    desc: it.vod_remarks,
                    content: it.vod_blurb,
                    pic_url: it.vod_pic,
                });
            });
            setResult(d);
        } catch (e) {
            let search = `${rule.host}/index.php/ajax/suggest?mid=1&wd=${wd}&limit=9999`;
            let submitHtml = request(search);
            let d = [];
            let responseData = JSON.parse(submitHtml);
            let list = responseData.list;
            if (rule.search_match) {
                list = list.filter(item =>
                    item.name &&
                    new RegExp(wd, "i").test(item.name)
                );
            }
            list.forEach(it => {
                d.push({
                    title: it.name,
                    url: it.id,
                    pic_url: it.pic,
                });
            });
            setResult(d);
        }
    }),

}