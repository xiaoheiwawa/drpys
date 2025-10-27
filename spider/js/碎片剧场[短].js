/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '碎片剧场[全剧]',
  '类型': '影视',
  lang: 'dr2'
})
*/

globalThis.h_ost = 'https://free-api.bighotwind.cc';

// 在外部定义函数并挂载到全局
globalThis.guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

globalThis.encHex = function(txt) {
    var k = CryptoJS.enc.Utf8.parse("p0sfjw@k&qmewu#w");
    var e = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(txt),
        k, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }
    );
    return e.ciphertext.toString(CryptoJS.enc.Hex);
};

// 预处理：获取token
globalThis.getToken = function() {
    let openId = md5(guid()).substring(0, 16);
    let api = "https://free-api.bighotwind.cc/papaya/papaya-api/oauth2/uuid";
    let body = JSON.stringify({
        "openId": openId
    });
    let key = encHex(Date.now().toString());
    let postData = JSON.parse(request(api, {
        method: 'POST',
        headers: {
            "key": key
        },
        body: body
    })).data;
    return postData.token;
};

var rule = {
    title: '碎片剧场[全剧]',
    host: h_ost,
    url: '/papaya/papaya-api/videos/page?type=5&tagId=fyclass&pageNum=fypage&pageSize=12',
    homeUrl: '/',
    detailUrl: '/papaya/papaya-api/videos/info?videoCode=fyid&page=1&pageSize=1000',
    searchUrl: '/papaya/papaya-api/videos/page?type=5&search=**&pageNum=fypage&pageSize=12',
    headers: {
        'User-Agent': 'okhttp/3.12.11',
    },
    timeout: 5000,
    filterable: 1,
    limit: 20,
    multi: 1,
    searchable: 2,
    play_parse: true,
    search_match: true, 
    
    // 分类数据
    class_parse: $js.toString(() => {
        let token = getToken();
        let tagsapi = "https://free-api.bighotwind.cc/papaya/papaya-api/theater/tags";
        let tagdata = JSON.parse(request(tagsapi, {
            headers: {
                "Authorization": token
            }
        })).data;
        
        let classes = [];
        let filterObj = {};
        
        // 添加"全部"分类
        classes.push({
            type_name: '全部',
            type_id: ''
        });
        
        // 使用tagdata构建分类
        tagdata.forEach((tag) => {
            classes.push({
                type_name: tag.text_val,
                type_id: tag.id.toString(),
            });
        });
        
        input = classes;
    }),

    lazy: $js.toString(() => {
        let videoUrl = `https://speed.rouzwv.com/papaya/papaya-file/files/download/${input}`;
        input = {
            parse: 0,
            url: videoUrl
        };
    }),
    
    一级: $js.toString(() => {
        let d = [];
        
        // 获取token
        let token = getToken();
        
        // 构建请求选项
        const options = {
            headers: {
                "Authorization": token,
                "User-Agent": "okhttp/3.12.11"
            }
        };
        
        let html = request(input, options);
        let response = JSON.parse(html);
        let data = response.list;
        data.forEach((it) => {
            // 构建复合ID：itemId@videoCode
            let compoundId = it.itemId + '@' + it.videoCode;
            
            d.push({
                title: it.title,
                img: "https://speed.rouzwv.com/papaya/papaya-file/files/download/" + it.imageKey+"/"+it.imageName,
                year: it.publishDate ? it.publishDate.toString() : '',
                desc: `集数:${it.episodesMax} 播放:${it.hitShowNum}`,
                remarks: it.content || it.description || '',
                url: compoundId // 使用复合ID
            });
        });
        setResult(d);
    }),

    二级: $js.toString(() => {
        // 获取token
        let token = getToken();
        
        const options = {
            headers: {
                "Authorization": token,
                "User-Agent": "okhttp/3.12.11"
            }
        };
        
        // 解析复合ID：itemId@videoCode
        let compoundId = orId;
        let ids = compoundId.split('@');
        let itemId = ids[0];
        let videoCode = ids[1];
        
        // 根据实际情况构建详情页URL
        let detailUrl = `https://free-api.bighotwind.cc/papaya/papaya-api/videos/info?videoCode=${videoCode}&itemId=${itemId}`;
        
        let response = JSON.parse(request(detailUrl, options));
        let data = response.data || response;
        VOD = {
            vod_name: data.title,
            vod_pic: "https://speed.rouzwv.com/papaya/papaya-file/files/download/" + data.imageKey+"/"+data.imageName,
            vod_remarks: `共${data.episodesMax}集`,
            vod_content: data.content || data.description || `播放量:${data.hitShowNum} 点赞:${data.likeNum}`
        };
        
        // 处理播放列表 - 只处理多集情况
        let playList = [];
        
        if (data.episodesList && data.episodesList.length > 0) {
            // 有多集数据，按集数排序
            data.episodesList.sort((a, b) => a.episodes - b.episodes);
            
            // 构建播放列表
            data.episodesList.forEach((episode) => {
                let episodeTitle = `第${episode.episodes}集`;
                let playUrl = "";
                
                // 选择最高清晰度的播放链接
                if (episode.resolutionList && episode.resolutionList.length > 0) {
                    // 按清晰度排序，选择最高的
                    episode.resolutionList.sort((a, b) => b.resolution - a.resolution);
                    let bestResolution = episode.resolutionList[0];
                    playUrl = `${bestResolution.fileKey}/${bestResolution.fileName}`;
                } else if (episode.mainFileKey) {
                    // 如果没有resolutionList，使用mainFileKey
                    playUrl = `${episode.mainFileKey}/${episode.fileName || 'video.mp4'}`;
                }
                
                if (playUrl) {
                    playList.push(`${episodeTitle}$${playUrl}`);
                }
            });
        }
        
        VOD.vod_play_from = '碎片剧场';
        VOD.vod_play_url = playList.join('#');
    }),
    
    搜索: $js.toString(() => {
        let d = [];
        
        // 获取token
        let token = getToken();
        
        // 构建请求选项
        const options = {
            headers: {
                "Authorization": token,
                "User-Agent": "okhttp/3.12.11"
            }
        };
        
        let html = request(input, options);
        let response = JSON.parse(html);
        let data = response.list;
        
        data.forEach((it) => {
            // 构建复合ID：itemId@videoCode
            let compoundId = it.itemId + '@' + it.videoCode;
            
            d.push({
                title: it.title,
                img: "https://speed.rouzwv.com/papaya/papaya-file/files/download/" + it.imageKey+"/"+it.imageName,
                year: it.publishDate ? it.publishDate.toString() : '',
                desc: `集数:${it.episodesMax} 播放:${it.hitShowNum}`,
                remarks: it.content || it.description || '',
                url: compoundId // 使用复合ID
            });
        });
        setResult(d);
    }),
}