/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '金牌影院',
  lang: 'ds'
})
*/

// http://localhost:5757/api/金牌影院?ac=list&t=1&pg=1
// http://localhost:5757/api/金牌影院?ac=detail&ids=/detail/131374
// http://localhost:5757/api/金牌影院?wd=我的&pg=1
// http://localhost:5757/api/金牌影院?play=/vod/play/131374/sid/1125278&flag=金牌影院
var rule = {
    类型: '影视',
    title: '金牌影院',
    desc: '金牌影院纯js版本',
    host: '', 
    homeUrl: '/api/mw-movie/anonymous/home/hotSearch',
    url: '/api/mw-movie/anonymous/video/list?pageNum=fypage&pageSize=30&sort=1&sortBy=1&type1=fyclass',
    searchUrl: '/api/mw-movie/anonymous/video/searchByWordPageable?keyword=**&pageNum=fypage&pageSize=12&type=false',
    searchable: 1,
    quickSearch: 1,
    timeout: 5000,
    play_parse: true,
    search_match: true,
    // 公共配置
    common: {
        key: 'cb808529bae6b6be45ecfab29a4889bc',
        deviceId: '58a80c52-138c-48fd-8edb-138fd74d12c8',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    },

    // 签名方法
    _sign: function(params) {
        const t = new Date().getTime();
        const signkey = `${params}&key=${this.common.key}&t=${t}`;
        return {
            key: CryptoJS.SHA1(CryptoJS.MD5(signkey).toString()).toString(),
            t: t
        };
    },
    
    // 统一请求方法（带域名检测）
    _request: async function(url, params) {
        const sign = this._sign(params);
        const fullUrl = this.host + url;
        return request(fullUrl, {
            method: 'GET',
            headers: {
                'User-Agent': this.common.ua,
                'Accept': 'application/json, text/plain, */*',
                'deviceId': this.common.deviceId,
                'sign': sign.key,
                't': sign.t.toString()
            }
        });
    },
    
    hostJs: async function () {
        const hosts = [
            "https://www.sizhengxt.com", 
            "https://www.jiabaide.cn",
            "https://m.9zhoukj.com",
            "https://m.cqzuoer.com"
        ];
        
        try {
            const requests = hosts.map(host => 
                new Promise((resolve, reject) => {
                    request(host, { 
                        timeout: 10000,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
                        }
                    }).then(response => {
                        console.log(`✅域名可用: ${host}`);
                        resolve(host);
                    }).catch(error => {
                        console.log(`❌域名不可用: ${host} - ${error.message}`);
                        reject(error);
                    });
                })
            );
            
            const availableHost = await Promise.any(requests);
            console.log(`✅最终选择域名: ${availableHost}`);
             this.host = availableHost;
            return host;
        } catch (error) {
            console.log('所有域名都不可用，使用默认域名');
            this.host = hosts[0];
            return this.host;
        }
    },

    class_parse: async function() {
        let classes = [{
            type_id: '1',
            type_name: '电影',
        },{
            type_id: '2',
            type_name: '剧集',
        },{
            type_id: '3',
            type_name: '综艺',
        },{
            type_id: '4',
            type_name: '动漫',
        }];
        return {
            class: classes,
        }
    },

    一级: async function (tid, pg, filter, extend) {
        let { MY_PAGE, MY_CATE } = this;
        const params = `pageNum=${MY_PAGE}&pageSize=30&sort=1&sortBy=1&type1=${MY_CATE}`;
        const url = `/api/mw-movie/anonymous/video/list?${params}`;
        
        const response = await this._request(url, params);
        const data = JSON.parse(response).data;
        let d = [];
        const list = data.list || [];
        list.forEach((it) => {
            d.push({
                title: it.vodName,
                url: '/detail/' + it.vodId,
                desc: it.vodRemarks || it.vodVersion,
                pic_url: it.vodPic,
            })
        })
        
        return setResult(d)
    },

    二级: async function (ids) {
        let id = ids[0];
        let id_ = id.split('/')[2];
        const params = `id=${id_}`;
        const url = `/api/mw-movie/anonymous/video/detail?${params}`;
        
        const response = await this._request(url, params);
        const data = JSON.parse(response).data;
        let VOD = {
            vod_id: id,
            vod_name: data.vodName,
            type_name: data.ctypeName,
            vod_pic: data.vodPic,
            vod_content: data.vodContent,
            vod_year: data.vodYear,
            vod_area: data.vodArea,
            vod_actor: data.vodActor || '未知',
            vod_director: data.vodDirector || '未知',
            vod_remarks: data.vodRemarks || '完结'
        };
        
        const playUrls = (data.episodeList || []).map(it => 
            `${it.name}$${`/vod/play/${id_}/sid/${it.nid}`}`
        );
        VOD.vod_play_from = "金牌";
        VOD.vod_play_url = playUrls.join("#");
        return VOD;
    },

    搜索: async function (wd, quick, pg) {
        let {input, KEY, MY_PAGE} = this;
        const params = `keyword=${KEY}&pageNum=${MY_PAGE}&pageSize=12&type=false`;
        const url = `/api/mw-movie/anonymous/video/searchByWordPageable?${params}`;
        
        const data = JSON.parse(await this._request(url, params)).data;
        let d = [];
        const list = data.list || [];
        list.forEach((it) => {
            let title = it.vodName;
            if (rule.search_match && !title.includes(wd)) {
                return;
            }
            d.push({
                title: it.vodName,
                url: '/detail/' + it.vodId,
                img: it.vodPic,
                desc: it.vodRemarks || it.vodSerial || it.vodTotal,
                content: it.vodBlurb
            })
        })
        return setResult(d)
    },

    lazy: async function (flag, id, flags) {
        let { input} = this;
        const pid = input.split("/")[3];
        const nid = input.split("/")[5];
        const params = `clientType=1&id=${pid}&nid=${nid}`;
        const url = `/api/mw-movie/anonymous/v2/video/episode/url?${params}`;
        
        const playData = JSON.parse(await this._request(url, params)).data;
        let list = playData.list;
        let urls = [];
        list.forEach((it) => {
            urls.push(it.resolutionName, it.url);
        });
        return {parse: 0, url: urls};
    },
};

