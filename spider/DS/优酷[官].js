/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '优酷[官]',
  lang: 'ds'
})
*/
const { danmuProxy } = $.require('./_lib.danmuProxy.js');

var rule = {
    title: '优酷[官]',
    host: 'https://www.youku.com',
    homeUrl: '/category/data?optionRefresh=1&pageNo=1&params={fl}',
    searchUrl: 'https://search.youku.com/api/search?pg=fypage&keyword=**',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    multi: 1,
    url: '/category/data?optionRefresh=1&pageNo=fypage&params=fyfilter',
    filter_url: '{{fl}}',

    headers: {
        'User-Agent': 'PC_UA',
        'Referer': 'https://www.youku.com',
    },
    timeout: 5000,
    limit: 20,
    play_parse: true,
  //  class_name: '电视剧&电影&综艺&动漫&少儿&纪录片&文化&亲子&教育&搞笑&生活&体育&音乐&游戏',
   // class_url: '电视剧&电影&综艺&动漫&少儿&纪录片&文化&亲子&教育&搞笑&生活&体育&音乐&游戏',
   
class_parse: async function() {
    const { input } = this;
    const categories = ["电视剧", "电影", "综艺", "动漫", "少儿", "纪录片", "文化", "亲子", "教育", "搞笑", "生活", "体育", "音乐", "游戏"];
    const classes = categories.map(category => ({ type_name: category, type_id: category }));
    
    const filters = {};

    for (const category of categories) {
        try {
            // 构造当前分类的URL
            const url = input.replaceAll('fl', `"type":"${category}"`);
            const response = await fetch(url, { headers: rule.headers, timeout: 10000 });
            const data = JSON.parse(response); // 解析JSON
            
            // 获取筛选数据
            const filterData = data.data.filterData.filter.filterData;
            const categoryFilters = [];
            
            for (let i = 0; i < filterData.length; i++) {
                const group = filterData[i];
                const filterKey = group.filterType;
                const filterName = group.title;
                
                const filterObj = {
                    key: filterKey,
                    name: filterName,
                    value: []
                };

                for (const item of group.subFilter) {
                    if (item.title) {
                        filterObj.value.push({
                            n: item.title,
                            v: item.value || ''
                        });
                    }
                }
                
                categoryFilters.push(filterObj);
            }
            
            filters[category] = categoryFilters;
        } catch (error) {
            console.error(`处理分类[${category}]时出错:`, error);
            filters[category] = []; // 出错时设为空数组
        }
    }

    return {
        class: classes,
        filters: filters
    };
},
    
    一级: async function () {
    let {
        input, 
        MY_CATE, 
        MY_FL, 
        MY_PAGE,
    } = this;
        let d = [];
        MY_FL.type = MY_CATE;
        let fl = stringify(MY_FL);
        fl = encodeUrl(fl);
        input = input.split("{")[0] + fl;
        if (MY_PAGE > 1) {
            let old_session = getItem("yk_session_" + MY_CATE, "{}");
            if (MY_PAGE === 2) {
                input = input.replace("optionRefresh=1", "session=" + encodeUrl(old_session))
            } else {
                input = input.replace("optionRefresh=1", "session=" + encodeUrl(old_session))
            }
        }
        let html = await fetch(input, rule.headers);
        try {
            html = JSON.parse(html);
            let lists = html.data.filterData.listData;
            let session = html.data.filterData.session;
            session = stringify(session);
            if (session !== getItem("yk_session_" + MY_CATE, "{}")) {
                setItem("yk_session_" + MY_CATE, session)
            }
            lists.forEach(function (it) {
                let vid;
                if (it.videoLink.includes("id_")) {
                    vid = it.videoLink.split("id_")[1].split(".html")[0]
                } else {
                    vid = "msearch:"
                }
                d.push({
                    title: it.title,
                    img: it.img,
                    desc: it.summary,
                    url: "https://search.youku.com/api/search?appScene=show_episode&showIds=" + vid,
                    content: it.subTitle
                })
            })
        } catch (e) {
            log("一级列表解析发生错误:" + e.message)
        }
        return setResult(d);
    },
    
    二级: async function () {
    let {input} = this;
        let d = [];
         VOD = {};
        let html = await request(input);
        let json = JSON.parse(html);
        if (input.includes('keyword')) {
            input = "https://search.youku.com/api/search?appScene=show_episode&showIds=" + json.pageComponentList[0].commonData.showId;
            json = JSON.parse(await fetch(MY_URL, rule.headers))
        }
        let video_lists = json.serisesList;
      //  log(`✅video_lists的结果: ${JSON.stringify(video_lists, null, 4)}`);
        let name = json.sourceName;
        if (name.includes('优酷') && video_lists.length > 0) {
            let ourl = "https://v.youku.com/v_show/id_" + video_lists[0].videoId + ".html";
            let _img = video_lists[0].thumbUrl;
            let html = await fetch(ourl, {
                headers: {
                    Referer: "https://v.youku.com/",
                    "User-Agent": 'PC_UA'
                }
            });
            let json = html.includes('__INITIAL_DATA__') ? html.split("window.__INITIAL_DATA__ =")[1].split(";")[0] : "{}";
            if (json === "{}") {
                console.log("触发了优酷人机验证");
                VOD.vod_remarks = ourl;
                VOD.vod_pic = _img;
                VOD.vod_name = video_lists[0].title.replace(/(\d+)/g, "");
                VOD.vod_content = "触发了优酷人机验证,本次未获取详情,但不影响播放(" + ourl + ")"
            } else {
                try {
                    json = JSON.parse(json);
                    let moduleList = json.moduleList;
                   let m = moduleList[0].components[0].itemList[0];
                    let img = m.showImgV;
                    let _type = m.showGenre || '';
                    let _desc = m.introSubTitle || '';
                    let JJ = m.desc || '';
                    let _title = m.introTitle  || '';
                    VOD.vod_pic = img;
                    VOD.vod_name = _title;
                    VOD.vod_type = _type;
                    VOD.vod_remarks = _desc;
                    VOD.vod_content = JJ
                } catch (e) {
                    console.log("海报渲染发生错误:" + e.message);
                    console.log(json);
                    VOD.vod_remarks = name
                }
            }
        }
        
        if (!name.includes('优酷')) {
            VOD.vod_content = "非自家播放源,暂无视频简介及海报";
            VOD.vod_remarks = name
        }

        function adhead(url) {
            return encodeURIComponent(url)
        }

        video_lists.forEach((it) => {
            let url = "https://v.youku.com/v_show/id_" + it.videoId + ".html";
            if (it.thumbUrl) {
                d.push({
                    desc: it.showVideoStage ? it.showVideoStage.replace("期", "集") : it.displayName,
                    pic_url: it.thumbUrl,
                    title: it.title,
                    url: adhead(url)
                })
            } else if (!name.includes('优酷')) {
                d.push({
                    title: it.displayName || it.title,
                    url:  adhead(it.url)
                })
            }
        });
        VOD.vod_play_from = name;
        VOD.vod_play_url = d.map((it) => it.title + "$" + it.url)
            .join("#");
            
        return VOD;
    },


    搜索: async function () {
    let {input} = this;
        let d = [];
        let html = await request(input);
        let json = JSON.parse(html);
        json.pageComponentList.forEach((it) => {
            if (it.hasOwnProperty("commonData")) {
                let commonData = it.commonData;
                d.push({
                    title: commonData.titleDTO.displayName,
                    img: commonData.posterDTO.vThumbUrl,
                    desc: commonData.stripeBottom,
                    content: commonData.updateNotice + " " + commonData.feature,
                    url: "https://search.youku.com/api/search?appScene=show_episode&showIds=" + commonData.showId + "&appCaller=h5"
                })
            }
        });
        return setResult(d);
    },
    lazy: async function () {
        let { getProxyUrl, input } = this;
        // 1. 获取代理URL并安全处理
    let proxyUrl = getProxyUrl();
    console.log(`[弹幕流程] 1. 原始代理URL: ${proxyUrl}`);
    
    // 判断是否本地地址（更全面的检查）
    const isLocal = proxyUrl.includes('127.0.0.1') || 
                   proxyUrl.includes('localhost') || 
                   proxyUrl.includes('::1');
    
    // 非本地地址时升级为HTTPS
    if (!isLocal) {
        // 安全替换协议（只替换开头的http://）
        proxyUrl = proxyUrl.replace(/^http:\/\//, 'https://');
        console.log(`[弹幕流程] 1.1 升级为HTTPS: ${proxyUrl}`);
    }
        let dmurl2 = `http://dm.qxq6.com/zy/api.php?url=${encodeURIComponent(input)}`;

        let danmu = proxyUrl + "&url=" + encodeURIComponent(dmurl2);
        
        return {
            parse: 1,
            url: input,
            jx: 1,
            danmaku: danmu
        };
    },
    
    // 使用弹幕代理模块中的规则
    proxy_rule: danmuProxy.proxy_rule
}