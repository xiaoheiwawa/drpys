// 自动生成于 5/27/2025, 11:24:29 AM
// 原始文件: APPG[模版].js


var rule = {
    类型: '影视', // 规则类型
    host: '', // 网站主域名
    title: 'APPG[模版]', // 规则标题
    desc: 'APPG[模版]', // 规则描述
    homeUrl: '/api.php/getappapi.index/initV119', // 首页数据接口
    url: '/api.php/getappapi.index/typeFilterVodList?fyfilter', // 分类数据接口
    detailUrl: '/api.php/getappapi.index/vodDetail?vod_id=fyid', // 详情页接口
    filter_url: 'area={{fl.area or "全部"}}&year={{fl.year or "全部"}}&type_id=fyclass&page=fypage&sort={{fl.sort or "最新"}}&lang={{fl.lang or "全部"}}&class={{fl.class or "全部"}}',
    searchUrl: '/api.php/getappapi.index/searchList?keywords=**&type_id=0&page=fypage',
    searchable: 1, // 是否支持搜索
    filterable: 1, // 是否支持筛选
    quickSearch: 0, // 是否支持快速搜索
    headers: {
        'User-Agent': 'okhttp/3.14.9',
    },
    timeout: 5000, // 请求超时时间
    play_parse: true, // 是否启用播放解析
    hostJs: async function () {
        let { HOST } = this;
        HOST = rule.params.split('$')[0];

        return HOST;
    },
    预处理: async function () {
        let _host = rule.params.split('$')[0];
        let key = rule.params.split('$')[1] || '';
        let iv = rule.params.split('$')[2] || '';
        rule.key = key || ''; // 设置解密密钥
        rule.Iv = iv || key; // 设置解密初始向量

    },
    class_parse: async function () {
        let { input, pdfa, pdfh, pd } = this;
        let html = await fetch(input);
        let html1 = Decrypt(JSON.parse(html).data);
        let list = JSON.parse(html1);
        let data = list;
        let filterMap = {
            "class": "类型",
            "area": "地区",
            "lang": "语言",
            "year": "年份",
            "letter": "字母",
            "by": "排序",
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
            let mergedLangs = [...new Set([...originalLangs, ...defaultLangs])];
            typeExtend.lang = mergedLangs.join(",");
            typeExtend["sort"] = "最新,最热,最赞";
            classes.push({
                "type_name": item["type_name"],
                "type_id": item["type_id"]
            });
            let hasValidField = Object.keys(filterMap).some(key => 
                typeExtend[key]?.trim()
            );
            if (hasValidField) {
                let typeId = String(item["type_id"]);
                filters[typeId] = [];
                for (let key in typeExtend) {
                    if (key in filterMap && typeof typeExtend[key] === "string" && typeExtend[key].trim()) {
                        let values = typeExtend[key].split(",");
                        let options = [
    { "n": "全部", "v": "" }, 
                            ...values.map(v => ({ "n": v.trim(), "v": v.trim() }))
                        ];
                        filters[typeId].push({
                            "key": key,
                            "name": filterMap[key],
                            "value": options.filter(o => o.n)
                        });
                    }
                }
            }
        }

        return {
            "class": classes,
            "filters": filters
        };
    },
    一级: async function (tid, pg, filter, extend) {
        let { input } = this;
        let d = [];
        let html = await fetch(input);
        let html1 = Decrypt(JSON.parse(html).data);
        let list = JSON.parse(html1).recommend_list;
        list.forEach(item => {
            d.push({
                title: item.vod_name,
                desc: item.vod_remarks,
                pic_url: item.vod_pic,
                url: item.vod_id,
            })
        });
        return setResult(d);
    },
    二级: async function (ids) {
        let {input} = this;
        let html = await fetch(input);
        let html1 = Decrypt(JSON.parse(html).data);
        let list = JSON.parse(html1);
        let VOD = {
            vod_id: list.vod.vod_id,
            vod_name: list.vod.vod_name,
            type_name: list.vod.vod_class,
            vod_pic: list.vod.vod_pic,
            vod_remarks: list.vod.vod_remarks,
            vod_year: list.vod.vod_year,
            vod_area: list.vod.vod_area,
            vod_actor: list.vod.vod_actor,
            vod_director: list.vod.vod_director,
            vod_content: list.vod.vod_content
        };
        let playlist = list.vod_play_list;
        let playmap = {};
        let excludeRegex = /(备用线路①|720|花絮|广告)/i;
        let sortOrder = (a, b) => {
            let priorityList = ['自营', '腾讯','在看官方','云海','在看', '芒果', '奇异'];
            let getPriority = s => {
                let index = priorityList.findIndex(keyword => s.includes(keyword));
                return index !== -1 ? index + 1 : 99;
            };
            return getPriority(a) - getPriority(b);
        };
        for (let i in playlist) {
            let item = playlist[i];
            let form = item.player_info.show;
            let parse = item.player_info.parse;
            if (excludeRegex.test(form)) continue;
            if (!playmap[form]) playmap[form] = [];
            for (let j in item.urls) {
                let urlItem = item.urls[j];
                let isVideo = /\.(mp4|m3u8|flv|avi|mov|wmv|ts)$/i.test(urlItem.url);
                let url = isVideo ? urlItem.url : Encrypt(urlItem.url);
                playmap[form].push(
                    `${urlItem.name.trim()}$${url}*${parse}*token=${urlItem.token}`
                );
            }
        }
        let sortedForms = Object.keys(playmap).sort(sortOrder).filter(Boolean);
        VOD.vod_play_from = sortedForms.join('$$$');
        VOD.vod_play_url = sortedForms.map(form => playmap[form].join('#')).join('$$$');
        return VOD;
    },
    搜索: async function (wd, quick, pg) {
        let {input} = this;
        let d = [];
        let html = await fetch(input);
        try {
            let html1 = Decrypt(JSON.parse(html).data);
            let list = JSON.parse(html1).search_list;
            list.forEach(it => {
                d.push({
                    title: it.vod_name,
                    url: it.vod_id,
                    desc: it.vod_remarks,
                    content: it.vod_blurb,
                    pic_url: it.vod_pic,
                });
            });
        } catch (e) {
            console.error(e.message);
        }
        return setResult(d);
    },
    lazy: async function (flag, id, flags) {
        let { input, getProxyUrl } = this;

        let params = input.split('*');
        input = params[0];
        if (input.includes('.mp4') || input.includes('.m3u8')) {

            return { parse: 0, url: input };
        }
        let parse = params[1],
              token = params[2].replace('token=', '');
        let data = { parse_api: parse, url: input, token },
              formData = new URLSearchParams(data),
              options = { method: 'POST',
    headers: rule.headers, body: formData.toString() },
              decryptedInput = Decrypt(input);
        if (parse.includes('http')) {

            let html = await request(parse + decryptedInput);
            if (!html) {
                return { jx:1, parse: 1, url: decryptedInput };
            }
            let htmlParsed = JSON.parse(html);
            return { parse: 0, url: htmlParsed.url };
        }
        if (decryptedInput.includes('.mp4') || decryptedInput.includes('.m3u8')) {
            return { parse: 0, url: decryptedInput };
        }

        let html = await post(rule.host + '/api.php/getappapi.index/vodParse', options);
        if (!html) {
            return { jx:1, parse: 1, url: decryptedInput };
        }
        let dataFromHtml = JSON.parse(html).data;
        let jdata = Decrypt(dataFromHtml);
        let outerData = JSON.parse(jdata);
        let innerData = JSON.parse(outerData.json);
        if (innerData.url) {
            return { parse: 0, url: innerData.url };
        } else {
            return { jx:1, parse: 1, url: decryptedInput };
        }
    },
    proxy_rule: async function () {
        let {input} = this;
        if (input) {
            let html1 = await request(input);
            let m3u8 = html1.includes('http') 
                ? html1.replace(/#EXT-X-DISCONTINUITY[\s\S]*?#EXT-X-DISCONTINUITY/, '#EXT-X-DISCONTINUITY') 
                : html1.replace(/#EXT-X-DISCONTINUITY[\s\S]*?#EXT-X-DISCONTINUITY/, '#EXT-X-DISCONTINUITY')
                      .replace(/^(\w.*?)$/gm, input.match(/http.*\//)[0] + '$1');
            return [200, 'application/vnd.apple.mpegurl', m3u8]
        }
    }
};
function Decrypt(word) {
    let key = CryptoJS.enc.Utf8.parse(rule.key);
    let iv = CryptoJS.enc.Utf8.parse(rule.key);
    let decrypt = CryptoJS.AES.decrypt(word, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
}
function Encrypt(word) {
    let key = CryptoJS.enc.Utf8.parse(rule.key);
    let iv = CryptoJS.enc.Utf8.parse(rule.key);
    let encrypt = CryptoJS.AES.encrypt(word, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    let encryptedStr = encrypt.toString(CryptoJS.enc.base64);
    return encryptedStr.toString();
}