/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '番茄短剧',
  lang: 'dr2'
})
*/

var rule = {
    title: '番茄短剧',
    host: 'http://fqgo.52dns.cc',
    url: '/catalog?book_id=fyclass',
    searchUrl: '/search?query=**&tab_type=12&offset=fypage',
    detailUrl: '/catalog?book_id=fyid',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
        'X-SS-REQ-TICKET': Date.now().toString()
    },
    timeout: 5000,
    class_name: '热剧&新剧&逆袭&总裁&现言&打脸&马甲&豪门&都市&神豪',
    class_url: 'videoseries_hot&firstonlinetime_new&cate_739&cate_29&cate_3&cate_1051&cate_266&cate_1053&cate_261&cate_20',
    play_parse: true,
    search_match: true,
    double: true,
    lazy: async function () {
        let {input} = this;
        let id = input;
        let api_url = rule.host + '/video?item_ids=' + id;
        let html = await request(api_url, {
            headers: rule.headers
        });
        let data = JSON.parse(html);
        let videoModel = data.data && data.data[id] && JSON.parse(data.data[id].video_model);
        let videoUrl = videoModel && videoModel.video_list && videoModel.video_list.video_1 && atob(videoModel.video_list.video_1.main_url);
        return  {
            parse: 0,
            url: videoUrl || '',
            js: ''
        };
    },

    推荐: async function () {
        let url = 'https://reading.snssdk.com/reading/bookapi/bookmall/cell/change/v?change_type=0&selected_items=videoseries_hot&tab_type=8&cell_id=6952850996422770718&version_tag=video_feed_refactor&device_id=1423244030195267&aid=1967&app_name=novelapp&ssmix=a';
        let html = await request(url, {
            headers: rule.headers
        });
        let data = JSON.parse(html);
        let items = [];
        
        if (data && data.data && data.data.cell_view && data.data.cell_view.cell_data) {
            items = data.data.cell_view.cell_data;
        } else if (data && data.search_tabs) {
            const shortDramaTab = data.search_tabs.find(function(tab) {
                return tab.title === '短剧' && tab.data;
            });
            items = shortDramaTab ? shortDramaTab.data : [];
        } else if (data && data.data) {
            items = [data.data];
        } else {
            items = [data || {}];
        }

        let VODS = items.map(item => {
            var videoData = (item.video_data && item.video_data[0]) || item;
            return {
                vod_id: videoData.series_id || videoData.book_id || videoData.id || '',
                vod_name: videoData.title || '未知短剧',
                vod_pic: videoData.cover || videoData.horiz_cover || '',
                vod_remarks: (videoData.sub_title || videoData.rec_text || ''),
            };
        });
        return VODS;
    },

    一级: async function () {
        let {MY_PAGE, MY_CATE} = this;
        let cateId = MY_CATE ; // 修正：直接使用分类标识
        let now = new Date();
        let sessionId = now.getUTCFullYear().toString() +
            String(now.getUTCMonth() + 1).padStart(2, '0') +
            String(now.getUTCDate()).padStart(2, '0') +
            String(now.getUTCHours()).padStart(2, '0') +
            String(now.getUTCMinutes()).padStart(2, '0');
        let baseUrl = `https://reading.snssdk.com/reading/bookapi/bookmall/cell/change/v?change_type=0&selected_items=${cateId}&tab_type=8&cell_id=6952850996422770718&version_tag=video_feed_refactor&device_id=1423244030195267&aid=1967&app_name=novelapp&ssmix=a&session_id=${sessionId}`;
        let page = MY_PAGE || 1;
        if (page > 1) {
            let offset = (page - 1) * 12;
            baseUrl += `&offset=${offset}`;
        }
        let html = await request(baseUrl, {
            headers: rule.headers
        });
        let data = JSON.parse(html);
        let items = [];

        if (data && data.data && data.data.cell_view && data.data.cell_view.cell_data) {
            items = data.data.cell_view.cell_data;
        } else if (data && data.search_tabs) {
            const shortDramaTab = data.search_tabs.find(function(tab) {
                return tab.title === '短剧' && tab.data;
            });
            items = shortDramaTab ? shortDramaTab.data : [];
        } else if (Array.isArray(data && data.data)) {
            items = data.data;
        } else if (data && data.data) {
            items = [data.data];
        } else {
            items = [data || {}];
        }

        let VODS = items.map(item => {
            var videoData = (item.video_data && item.video_data[0]) || item;
            return {
                vod_id: videoData.series_id || videoData.book_id || videoData.id || '',
                vod_name: videoData.title || '未知短剧',
                vod_pic: videoData.cover || videoData.horiz_cover || '',
                vod_remarks: (videoData.sub_title || videoData.rec_text || ''),
            };
        });
        return VODS;
    },

    二级: async function () {
        let {input} = this;
        let html = await request(input);
        let data = JSON.parse(html).data;
        let bookInfo = data.book_info;
        let playList = data.item_data_list.map(item => {
            return `${item.title}$${item.item_id}`;
        }).join('#');
        let VOD = {
            vod_id: bookInfo.book_id,
            vod_name: bookInfo.book_name,
            vod_type: bookInfo.tags,
            vod_year: bookInfo.create_time,
            vod_pic: bookInfo.thumb_url || bookInfo.audio_thumb_uri,
            vod_content: bookInfo.abstract || bookInfo.book_abstract_v2,
            vod_remarks: bookInfo.sub_info || `更新至${data.item_data_list.length}集`,
            vod_play_from: '番茄短剧',
            vod_play_url: playList
        };
        return VOD;
    },

    搜索: async function () {
    let {input, KEY,MY_PAGE} = this;
    let page = MY_PAGE || 1;
    let offset = (page - 1) * 12;
    let searchUrl = rule.host + '/search?query=' + KEY + '&tab_type=12&offset=' + offset;
    let html = await request(searchUrl, {headers: rule.headers});
    let data = JSON.parse(html);
    
    // 查找 tab_type 为 12 的短剧数据
    const shortDramaTab = data.search_tabs.find(tab => tab.tab_type === 12);
    if (!shortDramaTab || !shortDramaTab.data) {
        return []; // 如果没有短剧数据，返回空数组
    }
    
    let d = [];
    shortDramaTab.data.forEach(item => {
        // 每个item是一个短剧系列
        let videoData = item.video_data && item.video_data[0]; // 取第一个视频数据
        let videoDetail = videoData.video_detail; // 取第一个视频数据
        if (!videoData) {
            return; // 如果没有视频数据，跳过
        }
        
        let title = videoData.title || item.raw_book_name ;
        let cover = videoData.cover; // 封面
        let episodeCnt = videoData.episode_cnt; // 总集数
        let remarks = videoData.sub_title; // 备注信息
        let seriesId = item.book_id; // 系列ID，用于二级详情
        if (rule.search_match && !title.includes(KEY)) {
            console.log(`⏩ 过滤不匹配关键词的项目: ${title}`);
            return; // 跳过不匹配关键词的项目
        }
        d.push({
                    title: title,
                    year: item.vod_year,
                    desc: remarks ,
                    content: videoDetail.series_intro,
                    img: cover,
                    url: seriesId,
                });
        
    });
        return setResult(d);
    
    }    
}