/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 1,
  title: '苹果',
  lang: 'ds'
})
*/

globalThis.h_ost = 'http://item.xpgtv.com/';
globalThis.playh_ost = 'http://c.xpgtv.net/m3u8/';

var rule = {
    title: '苹果',
    host: h_ost,
    detailUrl: 'fyid',
    searchUrl: 'api.php/v2.vod/androidsearch10086?page=fypage&wd=**',
    url: '/api.php/v2.vod/androidfilter?page=fypage&fyfilter',
    filter_url: 'type=fyclass&area={{fl.area}}&year={{fl.year}}&sortby={{fl.by}}&class={{fl.class}}',
    searchable: 2,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'okhttp/3.12.11'
    },
    class_name: '电影&电视剧&综艺&动漫',
    class_url: '1&2&3&4',
    play_parse: 1,
  
    proxy_rule: async function () {
        const { input } = this;
        const options = {
            method: 'GET',
            headers: {
                'User-Agent': 'okhttp/3.12.11',
                'Connection': 'Keep-Alive',
                'Accept-Language': 'zh-CN,zh;q=0.8',
                'user_id': 'XPGBOX',
                'token2': 'XFxIummRrngadHB4TCzeUaleebTX10Vl/ftCvGLPeI5tN2Y/liZ5tY5e4t8=',
                'version': 'XPGBOX com.phoenix.tv1.3.3',
                'hash': '0d51',
                'screenx': '2331',
                'token': 'SH4EsXSBhi1ybXp3XQypB5lsfLfbzSpim+hOlmv7IIZ9Kkwoykkh1Y0r9dAKGx/0Smx2VqjAKdYKQuImbjN/Vuc2GWY/wnqwKk1McYhZES5fuT4fGlR0n2ii1nKqbBk8ketLdT0CXrXr8kcZVTdW77fUVG8S5jaTrSrsN/HnCiT4XT1GEkdnV0pqcr5wQL7NV2HHkG/e',
                'timestamp': '1731848468',
                'screeny': '1121'
            }
        };
        let html = await fetch(input + '.m3u8', options);            
        const parts = input.split('m3u8');
        const linesArray = html.split('\n');
        for (let i = 3; i < linesArray.length; i++) {
            if (linesArray[i].includes('key')) {
                linesArray[i] = linesArray[i].replace("/m3u8key", parts[0] + "m3u8key");
            }
        }
        return [200, 'application/vnd.apple.mpegurl', linesArray.join('\n')];
    },

    lazy: async function () {
    const { input } = this;
    let urls = getProxyUrl() + '&url=' + input;
    console.log('✅urls的结果:', urls);

    // 判断是否是本地地址
    let rurl = urls;
    if (!urls.includes('127.0.0.1')) {
        rurl = urls.replace('http', 'https');
    }
    console.log('✅rurl的结果:', rurl);

    return {
        parse: 0,
        url: rurl,
        jx: 0
    };
},
    
    推荐: async function () {
        const { host } = this;
        let d = [];
        let html = await request(`${host}/api.php/v2.main/androidhome`);
        const parsedData = JSON.parse(html);
        parsedData.data.list.forEach(item => {
            item.list.forEach(it => {
                it.status = it.classType2 === 1 ? "完结" : it.updateInfo.includes("集全") ? it.updateInfo : '更新至' + it.updateInfo + '集';
                d.push({
                    title: it.name,
                    img: it.pic,
                    year: it.year,
                    desc: it.status,
                    url: it.id
                });
            });
        });
        return setResult(d);
    },

    一级: async function () {
        let {getProxyUrl, MY_CATE, input} = this;
        let d = [];
        let html = await request(input);
        let data = JSON.parse(html).data;
        data.forEach(it => {
            it.status = it.classType2 === 1 ? "完结" : it.updateInfo.includes("全") ? it.updateInfo : '更新至' + it.updateInfo + '集';
            d.push({
                title: it.name,
                img: it.pic,
                year: it.year,
                desc: it.status,
                url: it.id
            });
        });
        return setResult(d);
    },
    
    二级: async function () {
        const { orId, host } = this;
        let html = await request(`${host}/api.php/v3.vod/androiddetail2?vod_id=${orId}`);
        let data = JSON.parse(html).data;
        VOD = {
            vod_name: data.name,
            type_name: data.className,
            vod_pic: data.pic,
            vod_content: data.content,
            vod_year: data.year,
            vod_area: data.area,
            vod_actor: data.actor || '未知',
            vod_director: data.director || '未知',
            vod_remarks: data.classType2 === 1 ? "完结" : data.updateInfo === "集全" ? data.updateInfo : '更新至' + data.updateInfo + '集'
        };
        let urls = [];
        data.urls.forEach(it => {
            urls.push(`${it.key}$${playh_ost}${it.url}`);
        });
        VOD.vod_play_from = "苹果";
        VOD.vod_play_url = urls.join('#');
        return VOD;
    },
    
    搜索: async function () {
        return this.一级();
    },
filter:'H4sIAAAAAAAAA+2X0U4aQRSG732KZq+5cNGq9VWMF9SS1NTaRrSJMSQqgkANILGiglIrBGpEQCmFpejL7Myyb9FlZ845s2lrbdI74Wq/85+dmXNm58+wMfbM+Wm6NjvnPm1ob4Lr2qy2sBQIhTSfthx4G3TQavbY2UeHPwSW1pzA3Ia27IRZtGpHqsMw5YR9UktWzX7BSuxKmRgzDgssUVEykCHDijd5JEoZxJhR2WfdnpKBDBl8K8M3DymDGNeRqHhmIcYx4kemkVDGQMaMSJJvnygZyOH5sG8M2hpYCQaoq6zQYHvGw12lVZYq9nEMligAZ+/UWboBUwtALVe2i19BE4Dat++sdAiaANSuKtZdCjQBbi3qZ7IeDKwo9XRbZq//cD0yB2bxj/ufS8V9VOKTFJ9U4xMUn1Djfor71bhOcV2Nj1N8XInrLzDuPCrxGYrPqPFpik+r8SmKT6lxqldX69WpXl2tV6d6dbVenerV1Xp1qtd5HO4YbNbLddoqnsoyI/3LVvFc28615ABr718FVoOri84LMLxpGLxxIPXXi6shVAb1HRaHzzO08G4lOJx73jem+Yfe8gdfEUftsScgXRpcROE7EuA9oZ7jiZp9muVHZbbVZpG0zPCEvH7kMSPSrtvMqIEmAD0oWbf6l2BAArwu6LFA0sq7jleBJsDrSR5DIi0VY+kb0ATgWnppFu3AWgTg5nXP+em+1CSQf0X5cR3NywWc71PM6SjMJwDn6+9TzyTge9G22QN3kTByw5EbPmU3dG9bE3+5bf2TK9qbCauyCb4mQD3VO0XlVDuAS7y+HzTiUpOA72VrPFmG9wTQCYryDjiMBFxL8dbsZmAtAtAp7lL2BaxFAmrGJbs+A00Azpe/GSQMmE8AvndQ5C1wUAnkAh0eT5tG1nFd9AIlhH1ofXF8EvogAMdobg+29uBtASMHGznYk3ewyf/pYA+5lPg/BydcAGqR2uAcnE8CjpmqWhlYvgTUMmfWFdyDJOCpjGXtYzhdErAlmdNBCu6YEnDMz+csD/dDCY+5A/KCQXcrCTjffYa8S8Jj7rus4bQJNl2CqpVvFc0B7GfpzvxxAv0UQHfOIovn8c7pAn1EN6wGri8Bx8wn+TG4twTqS5Pd57AvLozujiPnHTnv75zX/VrCPwF3YRkWsBMAAA=='
    
};
