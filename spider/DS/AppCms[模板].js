/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'AppRJ[模版]',
  lang: 'ds'
})
*/
const {req_} = $.require('./_lib.request.js')
//https://app.m3u8.news/api.php/Appfox/init
async function detectApiType(host) {
    const testApis = [
        '/api.php/Appfox/vod',
        '/api.php/provide/vod'
    ];
    let apiType;

    for (const api of testApis) {
        const testUrl = `${host}${api}`;
        try {
            console.log(`[API检测] 开始检测: ${testUrl}`);
            const res = await request(testUrl, {
                timeout: 3000
            });

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

            if (!jsonRes.list) {
                console.log(`[API检测] ${testUrl} list字段，跳过`);
                continue;
            }

            const code = jsonRes.code;
            if (code) {
                apiType = api.includes('Appfox') ? 'Appfox' : 'provide';
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
    return 'provide';
}

async function fetchValidJson(urls) {
    for (const url of urls) {
        try {
            const res = await request(url);
            return JSON.parse(res); // 直接返回解析后的JSON
        } catch {} // 忽略错误继续尝试
    }
    console.log(`[url检测] 成功！类型: ${urls}`);
    throw new Error("无有效JSON响应");
}


async function getFirstValidUrl(input) {
    const urls = [
        `http://194.147.100.155:7891/?url=${input}`,
        `http://111.170.141.143:999/api.php/?key=VOP2GjuNd9t4&url=${input}`
        // 可在此处添加更多备用链接
    ];

    const videoExtensions = ['.mp4', '.mkv', '.flv', '.avi', '.mov', '.m3u8'];

    for (const url of urls) {
        try {
            const resp = await fetch(url); // 实际使用时替换为您的请求库
            const jresp = JSON.parse(resp); // 直接返回解析后的JSON
            const videoUrl = jresp.url?.trim(); // 获取并清理URL
            if (videoUrl && videoExtensions.some(ext =>
                    videoUrl.toLowerCase().includes(ext)
                )) {
                console.log(`[有效的视频链接]: ${videoUrl}`);
                return videoUrl; // 返回有效的视频URL
            }
        } catch (error) {
            // 忽略错误继续尝试下一个链接
            console.debug(`链接失败: ${url}`, error.message);
        }
    }

    console.error("所有链接均未返回有效视频数据");
    return null;
}

var rule = {
    类型: '影视',
    host: '',
    title: 'AppRJ[模版]',
    desc: 'AppRJ[模版]',
    // url: '/api.php/Tapi/vod/?ac=detail&pg=fypage&t=fyclass',
    url: '/api.php/Tapi/vod/?ac=detail&pg=fypage&t=fyclass',
    homeUrl: '/api.php/Tapi/vod',
    detailUrl: '/api.php/Tapi/vod/?ac=detail&ids=fyid',
    searchUrl: '/api.php/Tapi/vod/?wd=**&pg=fypage',
    //  filter_url:'&class={{fl.class}}&area={{fl.area}}&lang={{fl.lang}}&year={{fl.year}}',
    searchable: 1,
    filterable: 1,
    quickSearch: 1,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 5000,
    play_parse: true,
    search_match: true,
    search_pic: true,
    cate_exclude: '网址|专题',
    title_remove: ['广告', '破解', '群'],
    line_remove: ['线路1', '线路2', '线路3'],
    line_order: ['JL4K', 'JL2K', '蓝光3'],
    playRegex: /\.m3u8|\.mp4|\.mkv/i,
    hostJs: async function() {
        try {
            if (rule.params) rule.params = ungzip(rule.params);
        } catch (e) {
            console.log(`[hostJs] ungzip解密失败: ${e.message}`);
        }

        const parts = (rule.params || '').split('$');
        const _host = parts[0] || '';
        return _host;
    },

    预处理: async function() {
        rule.apiType = await detectApiType(rule.host);
        const apiPaths = [
            'url', 'searchUrl', 'detailUrl', 'homeUrl'
        ];
        apiPaths.forEach(path => {
            rule[path] = rule[path].replace(/Tapi/g, rule.apiType);
            console.log(`[预处理] 更新接口路径 ${path}: ${rule[path]}`);
        });
    },

    class_parse: async function() {
        const {
            input
        } = this;
        const nurl = `${rule.homeUrl}`;
        const hurl = `${rule.host}/api.php/app/nav`;
        const data = await fetchValidJson([hurl, nurl]);
        const classes = [];
        const filterObj = {};
        const filterLabels = {
            "class": "类型",
            "area": "地区",
            "lang": "语言",
            "year": "年份",
            "letter": "字母",
            "by": "排序"
        };

        let jsonString = data.msg;
        let jsonData = jsonString.includes('导航') ? (data.list || []) : (data.class || []);

        for (let k = 0; k < jsonData.length; k++) {
            const currentItem = jsonData[k];
            // 排除type_pid为0的分类
            if (currentItem.type_pid === 0) continue;

            // 构建分类项
            classes.push({
                type_name: currentItem.type_name,
                type_id: currentItem.type_id
            });

            // 仅当存在有效扩展属性时才处理筛选器
            const hasExtend = typeof currentItem.type_extend === 'object' && currentItem.type_extend !== null;
            if (!hasExtend) continue;

            filterObj[String(currentItem.type_id)] = [];
            for (let filterKey in currentItem.type_extend) {
                if (filterKey in filterLabels && currentItem.type_extend[filterKey].trim() !== "") {
                    const values = currentItem.type_extend[filterKey].split(',');
                    const filterOptions = [{
                        "n": "全部",
                        "v": ""
                    }].concat(
                        values.map(value => ({
                            "n": value.trim(),
                            "v": value.trim()
                        }))
                    );
                    filterObj[String(currentItem.type_id)].push({
                        "key": filterKey,
                        "name": filterLabels[filterKey],
                        "value": filterOptions
                    });
                }
            }
        }

        return {
            class: classes,
            filters: filterObj
        };
    },



    一级: async function() {
        let {
            input,
            MY_CATE,
            MY_PAGE,
            MY_FL
        } = this;
        const d = [];
        const fl = MY_FL;
        

        // 拼接参数（使用默认值兜底）
        const params = [
            `class=${fl.class || ''}`,
            `area=${fl.area || ''}`,
            `lang=${fl.lang || ''}`,
            `year=${fl.year || ''}`
        ];

        const filter_url = `&${params.join('&')}`;

        //api.php/app/video?tid=fyclassfyfilter&limit=20&pg=fypag
        const hurl = `${rule.host}/api.php/app/video?tid=${MY_CATE}${filter_url}&limit=20&pg=${MY_CATE}`;
        const nurl = `${rule.homeUrl}/?ac=detail&pg=${MY_PAGE}&t=${MY_CATE}`;
        ///api.php/provide/vod/?ac=detail&pg=fypage&t=fyclass
        const data = await fetchValidJson([hurl, nurl]);
        //  log(`✅data的结果: ${JSON.stringify(data, null, 4)}`);

        const html = await request(nurl, {
            headers: rule.headers
        });
        //    const list = JSON.parse(html).list;
        const list = data.list;
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


    二级: async function() {
        let {
            input,
            orId
        } = this;
        log(`✅data的结果: ${orId}`);
        rule.id = orId;
        let html = await request(input);
        let data = JSON.parse(html).list[0];
        log(`✅data的结果: ${JSON.stringify(data, null, 4)}`);
        // 基本信息处理
        VOD = {
            vod_id: data['vod_id'] || '暂无id',
            vod_name: data['vod_name'] || '暂无名称',
            type_name: data['vod_class'] || data['type_name'] || '暂无类型', // 兼容两种字段名
            vod_pic: data['vod_pic'] || '暂无图片',
            vod_remarks: data['vod_remarks'] || '暂无备注',
            vod_year: data['vod_year'] || '暂无年份',
            vod_area: data['vod_area'] || '暂无地区',
            vod_actor: data['vod_actor'] || '暂无演员信息',
            vod_director: data['vod_director'] || '暂无导演',
            vod_content: data['vod_blurb'] || data['vod_content'] || '暂无剧情介绍'
        };

        // 播放线路处理
        let playFrom = (data['vod_play_from'] || '').split('$$$');
        let playUrl = (data['vod_play_url'] || '').split('$$$');
        let playServer = (data['vod_play_server'] || '').split('$$$');

        let playMap = {};

        // 处理每个播放源
        for (let i = 0; i < playFrom.length; i++) {
            let sourceName = playFrom[i].trim();
            if (!sourceName) continue;

            // 检查是否需要过滤该线路
            if (this.line_remove && this.line_remove.some(word =>
                    sourceName.toLowerCase().includes(word.toLowerCase()))) {
                continue;
            }

            let episodes = [];
            let urlGroup = playUrl[i] || '';

            // 解析每集URL
            urlGroup.split('#').forEach(item => {
                let parts = item.split('$');
                if (parts.length >= 2) {
                    episodes.push(`${parts[0]}$${parts[1]}`);
                }
            });

            if (episodes.length > 0) {
                playMap[sourceName] = episodes;
            }
        }

        // 线路排序
        let sortedSources = Object.keys(playMap);
        if (this.line_order && this.line_order.length > 0) {
            sortedSources.sort((a, b) => {
                let aIndex = this.line_order.findIndex(o => a.toLowerCase().includes(o.toLowerCase()));
                let bIndex = this.line_order.findIndex(o => b.toLowerCase().includes(o.toLowerCase()));
                aIndex = aIndex === -1 ? 999 : aIndex;
                bIndex = bIndex === -1 ? 999 : bIndex;
                return aIndex - bIndex;
            });
        }

        // 组装最终播放数据
        VOD.vod_play_from = sortedSources.join('$$$') || '暂无资源';
        VOD.vod_play_url = sortedSources.map(s => playMap[s].join('#')).join('$$$') || '暂无资源$0';
        return VOD;
    },
//https://www.jiabaide.cn/api/mw-movie/anonymous/v2/video/episode/url?clientType=1&id=138474&nid=1219720

    lazy: async function(flag, id, flags) {
    let { getProxyUrl, input } = this;
    const isPlayUrl = rule.playRegex.test(purl);

    // 处理"两个字母加横线"格式（如JL-xxx）
    if (/^[A-Za-z]{2}-/.test(input)) {
        const purl = await getFirstValidUrl(input);
        return {
            url: purl,
            parse: 0,
            header: rule.headers
        };
    }

    // 处理播放链接判断
    if (isPlayUrl) {
        console.log(`[播放处理] 直接播放: ${input}`);
        return {
            url: input,
            parse: 0,
            header: rule.headers
        };
    } else {
        return {
            url: input,
            jx: 1,
            header: rule.headers
        };
    }
},


    搜索: async function() {
        let {
            input,
            KEY,
            MY_PAGE
        } = this;
        const html = await request(input, {
            headers: rule.headers
        });
        const d = [];
        // 解析搜索数据
        const data = JSON.parse(html);
        let list = data.list || [];
        
        // 关键词过滤
        if (rule.search_match && KEY) {
            list = list.filter(item => {
                const title = item.vod_name || '';
                return title.includes(KEY);
            });
        }

        // 如果没有图片但需要强制获取图片
        if (rule.search_pic && list.length > 0 && !list[0].vod_pic) {
            try {
                // 构造详情页请求URL
                const ids = list.map(item => item.vod_id).join(',');
                const detailUrl = rule.detailUrl.replace('fyid', ids);
                
                // 请求详情页数据
                const detailHtml = await request(detailUrl, { headers: rule.headers });
                const detailData = JSON.parse(detailHtml);
                
                // 创建ID到图片的映射表
                const picMap = {};
                if (detailData.list) {
                    detailData.list.forEach(item => {
                        picMap[item.vod_id] = item.vod_pic;
                    });
                }
                
                // 更新列表中的图片
                list.forEach(item => {
                    if (picMap[item.vod_id]) {
                        item.vod_pic = picMap[item.vod_id];
                    }
                });
            } catch (e) {
                console.error(`强制获取搜索图片失败: ${e.message}`);
            }
        }

        // 构建结果集
        list.forEach(item => {
            const title = item.vod_name || '未知标题';
            
            d.push({
                title: title,
                desc: item.vod_remarks || '暂无描述',
                pic_url: item.vod_pic || '', // 使用可能更新后的图片
                url: item.vod_id 
            });
        });
        return setResult(d);
    }

}