/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '瓜子',
  lang: 'ds'
})
*/

var rule = {
    title: '瓜子',
    host: 'https://api.8utdtcq.com',
    url: '/App/IndexList/indexList',
    searchUrl: '/App/Index/findMoreVod#**',
    searchable: 2,
    quickSearch: 1,
    filterable: 1,
    class_name: '电影&电视剧&动漫&综艺&短剧',
    class_url: '1&2&4&3&64',
    // 注意：filter 字段在 DRPY 中通常不直接使用，可保留或移除
    filter: 'H4sIAAAAAAAAA+2a7U4aQRSG/3sVht/bZHf5WnorjWlo4YfphwlqE2NMtGoLWIsmFbRi2qYqoBgxtVVR8GZ2duUuOmchfuDuDHI2xJhD4hGYyTzv7hlm57yZ6aFh/gpogefDL5y38Jq+fuc0vklO8eZAPJWMB5S7Te/j75JebR/ibyeTd8Z1H/9mMBiJLZZb8+WusW7GhC5q4F7jzP3+Qsh2qbXxSQjpdMGSWrsb1umhkNTpgr6mXM06a4qvqd0FS7KqJbv5VUgyLxfsRsHKHyos+9NauuR3U2HNE7bZUKyFHP/E0hXF+rPmfOEMp/A/+HS1dOT827m0cwd2ZgOvtrBjFatCtZ0u6Fz/qHDp4ly3u2BJ5mmRLRfM+ndxupdrrL6rWPkaTwLb+sVveA3ubatStbZ2+B2GAdDTbvGfeZ4X62h3uU+6883I9adbCtxXoqlkPOW1Erm1PeKVSFf1kBDhdPCBEpRRgn5QdBlF94OiySiaHxRVRvEj+1pMQuEdfKAYMorhByUqo0T9oERklAiaoqnPtDA7O5aRwgoPIQhBCDoEDQJ+aqgq55vnvyUSVJXjVGCqQFdBhwqKVNCmRiBEIRgQ8HMp1ossLRZTFR40CDqEIIQQhDCECIQoBAMCXpbRmywDZBkgywBZBsgyQJYBsgyQZYAsA2QZeFnW5rFVqIhT6ONzcXzylddj0aXpET8VWbZsNop25rOIE0Zn52PVzq9KKHoMfTH5IsuUJJgIlmKnj6z5RQkliqaUVtnZuYRioBMzt2LN5iUUfF4yJfkd01T0xaTXzXpGhtF8+MnY32SZCeKnWX2PNdZkvxn0TbPnmq3vTdnVoCeanT20G3uyn6ZLbvpeocdSE55LtEtbf2u0fX7BVtLCNTrxcjSBf7wVZ3lxKeHEE4mJUX6FPsDs+QMJbPz1WAqPau2vs7TYHvJGeU0N591Ie0z+1H80fluxxr7UyW8jv438Nk8S+W2D8NugghOnk/y2Lgr5bQ+kkN9GfpurBPLbHiKL/LaB+W2bDbNeYpmS0D7Q/dk3yzBBfzbNMkzInx2zDIM3EJ19rAyD9lzam1gZBu3tWX9P2HZehsGbe86mWIZBu3vXu3ChteOC6XsxIGsHAXs61k6IrJ0uCFk7niSydtxJZO146CBrxxNC1g5ZO0IKWTvdFLJ2bkkga4esnYFaO+bpAVTC2bJ1sS8854A/g9I2KuQk9DGU4Y71Ike5eEl9J4tKbwTs6ZTeQSq9uyBUenuSqPR2J1Hp7aGDSm9PCJXeVHoLKVR6d1Oo9L4lgUpvKr0He6rC2Rfziu4qI9yl6+iDFXCqIlfrgYQ+W8H3f3xj1gPJp+MVPZBcTlj0PSuoxkfAnkCNPzTzH+StPxCsRAAA',

    // ========== 公共加解密函数 ==========
    _encrypt: function (plainText) {
        let key = CryptoJS.enc.Utf8.parse("mvXBSW7ekreItNsT");
        let iv = CryptoJS.enc.Utf8.parse("2U3IrJL8szAKp0Fj");
        let encrypted = CryptoJS.AES.encrypt(plainText, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
    },
    _decrypt: function (word, key, iv) {
        let encryptedHexStr = CryptoJS.enc.Hex.parse(word);
        let decrypt = CryptoJS.AES.decrypt({ ciphertext: encryptedHexStr }, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypt.toString(CryptoJS.enc.Utf8);
    },
    _rsaPublicKey: "MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGAe6hKrWLi1zQmjTT1ozbE4QdFeJGNxubxld6GrFGximxfMsMB6BpJhpcTouAqywAFppiKetUBBbXwYsYU1wNr648XVmPmCMCy4rY8vdliFnbMUj086DU6Z+/oXBdWU3/b1G0DN3E9wULRSwcKZT3wj/cCI1vsCm3gj2R5SqkA9Y0CAwEAAQKBgAJH+4CxV0/zBVcLiBCHvSANm0l7HetybTh/j2p0Y1sTXro4ALwAaCTUeqdBjWiLSo9lNwDHFyq8zX90+gNxa7c5EqcWV9FmlVXr8VhfBzcZo1nXeNdXFT7tQ2yah/odtdcx+vRMSGJd1t/5k5bDd9wAvYdIDblMAg+wiKKZ5KcdAkEA1cCakEN4NexkF5tHPRrR6XOY/XHfkqXxEhMqmNbB9U34saTJnLWIHC8IXys6Qmzz30TtzCjuOqKRRy+FMM4TdwJBAJQZFPjsGC+RqcG5UvVMiMPhnwe/bXEehShK86yJK/g/UiKrO87h3aEu5gcJqBygTq3BBBoH2md3pr/W+hUMWBsCQQChfhTIrdDinKi6lRxrdBnn0Ohjg2cwuqK5zzU9p/N+S9x7Ck8wUI53DKm8jUJE8WAG7WLj/oCOWEh+ic6NIwTdAkEAj0X8nhx6AXsgCYRql1klbqtVmL8+95KZK7PnLWG/IfjQUy3pPGoSaZ7fdquG8bq8oyf5+dzjE/oTXcByS+6XRQJAP/5ciy1bL3NhUhsaOVy55MHXnPjdcTX0FaLi+ybXZIfIQ2P4rb19mVq1feMbCXhz+L1rG8oat5lYKfpe8k83ZA==",

    // ========== 一级列表 ==========
    一级: $js.toString(() => {
        let d = [];
        const tid = MY_CATE;
        const page = MY_PAGE;
        const filters = MY_FL || {};

        // 子分类映射
        const subMap = { "1": "5", "2": "12", "4": "30", "3": "22", "64": "" };
        const sub = subMap[tid] || "";

        const timestamp = Math.floor(Date.now() / 1000);
        const reqData = {
            area: (filters.area || 0).toString(),
            sub: (filters.sub || sub).toString(),
            year: (filters.year || 0).toString(),
            pageSize: "30",
            sort: (filters.sort || "d_id").toString(),
            page: page,
            tid: tid
        };

        const request_key = JSON.stringify(reqData);
        const request_key2 = rule._encrypt(request_key);

        const signature = `token_id=,token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79,phone_type=1,request_key=${request_key2},app_id=1,time=${timestamp},keys=qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ+IOJyHnHflCj5w/7ESK7FgywMvrgjxbx0GklEFLI4+JshgySe633OIRstuktwdiCy3CT+fLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz/uurUif2OK4=*&zvdvdvddbfikkkumtmdwqppp?|4Y!s!2br`;
        const signature2 = md5(signature).toUpperCase();

        const body = `token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79&token_id=&phone_type=1&time=${timestamp}&phone_model=xiaomi-22021211rc&keys=qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ%2BIOJyHnHflCj5w%2F7ESK7FgywMvrgjxbx0GklEFLI4%2BJshgySe633OIRstuktwdiCy3CT%2BfLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz%2FuurUif2OK4%3D&request_key=${request_key2}&signature=${signature2}&app_id=1&ad_version=1`;

        const headers = {
            'Cache-Control': 'no-cache',
            'Version': '2406025',
            'PackageName': 'com.uf076bf0c246.qe439f0d5e.m8aaf56b725a.ifeb647346f',
            'Ver': '1.9.2',
            'Referer': 'https://api.8utdtcq.com',
            'X-Customer-Client-Ip': '127.0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'api.8utdtcq.com',
            'Connection': 'Keep-Alive',
            'User-Agent': 'okhttp/3.12.0'
        };

        const res = fetch(rule.host + rule.url, {
            method: 'POST',
            headers: headers,
            body: body,
            rejectCoding: true
        });

        const data = JSON.parse(res).data;
        const response_key = data.response_key;
        const keys = data.keys;
        const bodykeyiv = JSON.parse(RSA.decode(keys, rule._rsaPublicKey));
        const key = CryptoJS.enc.Utf8.parse(bodykeyiv.key);
        const iv = CryptoJS.enc.Utf8.parse(bodykeyiv.iv);
        const html = rule._decrypt(response_key, key, iv);
        const list = JSON.parse(html).list || [];

        list.forEach(item => {
            d.push({
                title: item.vod_name,
                desc: item.vod_continu == 0 ? '电影' : `更新至${item.vod_continu}集`,
                year: item.vod_scroe || '',
                img: item.vod_pic,
                url: `${item.vod_id}/${item.vod_continu}`
            });
        });

        setResult(d);
    }),

    // ========== 二级详情 ==========
    二级: $js.toString(() => {
        const vod_id = input.split('/')[0];
        const timestamp = Math.floor(Date.now() / 1000);

        // 第一步：获取视频信息
        const req1 = JSON.stringify({
            token_id: "393668",
            vod_id: vod_id,
            mobile_time: timestamp,
            token: "1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79"
        });
        const key1 = rule._encrypt(req1);
        const sig1 = `token_id=,token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79,phone_type=1,request_key=${key1},app_id=1,time=${timestamp},keys=Qmxi5ciWXbQzkr7o+SUNiUuQxQEf8/AVyUWY4T/BGhcXBIUz4nOyHBGf9A4KbM0iKF3yp9M7WAY0rrs5PzdTAOB45plcS2zZ0wUibcXuGJ29VVGRWKGwE9zu2vLwhfgjTaaDpXo4rby+7GxXTktzJmxvneOUdYeHi+PZsThlvPI=*&zvdvdvddbfikkkumtmdwqppp?|4Y!s!2br`;
        const sig1_md5 = md5(sig1);
        const body1 = `token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79&token_id=&phone_type=1&time=${timestamp}&phone_model=xiaomi-22021211rc&keys=Qmxi5ciWXbQzkr7o%2BSUNiUuQxQEf8%2FAVyUWY4T%2FBGhcXBIUz4nOyHBGf9A4KbM0iKF3yp9M7WAY0rrs5PzdTAOB45plcS2zZ0wUibcXuGJ29VVGRWKGwE9zu2vLwhfgjTaaDpXo4rby%2B7GxXTktzJmxvneOUdYeHi%2BPZsThlvPI%3D&request_key=${key1}&signature=${sig1_md5}&app_id=1&ad_version=1`;

        const headers = {
            'Cache-Control': 'no-cache',
            'Version': '2406025',
            'PackageName': 'com.uf076bf0c246.qe439f0d5e.m8aaf56b725a.ifeb647346f',
            'Ver': '1.9.2',
            'Referer': 'https://api.8utdtcq.com',
            'X-Customer-Client-Ip': '127.0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'api.8utdtcq.com',
            'Connection': 'Keep-Alive',
            'User-Agent': 'okhttp/3.12.0'
        };

        const res1 = fetch(rule.host + '/App/IndexPlay/playInfo', {
            method: 'POST', headers, body: body1, rejectCoding: true
        });
        const data1 = JSON.parse(res1).data;
        const rk1 = data1.response_key;
        const ks1 = data1.keys;
        const bk1 = JSON.parse(RSA.decode(ks1, rule._rsaPublicKey));
        const html1 = rule._decrypt(rk1, CryptoJS.enc.Utf8.parse(bk1.key), CryptoJS.enc.Utf8.parse(bk1.iv));
        const vodInfo = JSON.parse(html1).vodInfo;

        // 第二步：获取播放列表
        const req2 = JSON.stringify({ vurl_cloud_id: "2", vod_d_id: vod_id });
        const key2 = rule._encrypt(req2);
        const sig2 = `token_id=,token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79,phone_type=1,request_key=${key2},app_id=1,time=${timestamp},keys=Qmxi5ciWXbQzkr7o+SUNiUuQxQEf8/AVyUWY4T/BGhcXBIUz4nOyHBGf9A4KbM0iKF3yp9M7WAY0rrs5PzdTAOB45plcS2zZ0wUibcXuGJ29VVGRWKGwE9zu2vLwhfgjTaaDpXo4rby+7GxXTktzJmxvneOUdYeHi+PZsThlvPI=*&zvdvdvddbfikkkumtmdwqppp?|4Y!s!2br`;
        const sig2_md5 = md5(sig2);
        const body2 = `token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79&token_id=&phone_type=1&time=${timestamp}&phone_model=xiaomi-22021211rc&keys=Qmxi5ciWXbQzkr7o%2BSUNiUuQxQEf8%2FAVyUWY4T%2FBGhcXBIUz4nOyHBGf9A4KbM0iKF3yp9M7WAY0rrs5PzdTAOB45plcS2zZ0wUibcXuGJ29VVGRWKGwE9zu2vLwhfgjTaaDpXo4rby%2B7GxXTktzJmxvneOUdYeHi%2BPZsThlvPI%3D&request_key=${key2}&signature=${sig2_md5}&app_id=1&ad_version=1`;

        const res2 = fetch(rule.host + '/App/Resource/Vurl/show', {
            method: 'POST', headers, body: body2, rejectCoding: true
        });
        const data2 = JSON.parse(res2).data;
        const rk2 = data2.response_key;
        const ks2 = data2.keys;
        const bk2 = JSON.parse(RSA.decode(ks2, rule._rsaPublicKey));
        const html2 = rule._decrypt(rk2, CryptoJS.enc.Utf8.parse(bk2.key), CryptoJS.enc.Utf8.parse(bk2.iv));
        const playList = JSON.parse(html2).list || [];

        let playUrls = [];
        playList.forEach(item => {
            const playParams = Object.values(item.play);
            let lastParam = null;
            for (let i = playParams.length - 1; i >= 0; i--) {
                if (playParams[i].param) {
                    lastParam = playParams[i].param;
                    break;
                }
            }
            const vurlIdMatch = lastParam ? lastParam.match(/vurl_id=(\d+)/) : null;
            const resMatch = lastParam ? lastParam.match(/resolution=(\d+)/) : null;
            if (vurlIdMatch) {
                const resolution = resMatch ? resMatch[1] : '0';
                playUrls.push(`${item.title}$${vod_id}/${vurlIdMatch[1]}?${resolution}`);
            }
        });

        VOD = {
            title: vodInfo.vod_name,
            type: (vodInfo.videoTag || []).join(' '),
            desc: vodInfo.vod_use_content || '',
            vod_actor: vodInfo.vod_actor || '',
            vod_area: vodInfo.vod_area || '',
            vod_director: vodInfo.vod_director || '',
            img: vodInfo.vod_pic,
            vod_play_from: '瓜子',
            vod_play_url: playUrls.join('#')
        };
    }),

    // ========== 播放解析 ==========
    lazy: $js.toString(() => {
        const [vod_id, rest] = input.split('/');
        const [vurl_id, resolution] = rest.split('?');

        const timestamp = Math.floor(Date.now() / 1000);
        const reqData = {
            domain_type: "8",
            vod_id: vod_id,
            type: "play",
            resolution: resolution || "0",
            vurl_id: vurl_id
        };
        const request_key = JSON.stringify(reqData);
        const request_key2 = rule._encrypt(request_key);

        const signature = `token_id=,token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79,phone_type=1,request_key=${request_key2},app_id=1,time=${timestamp},keys=ZH8gpdp9bxjuG2NK97sol3o7Uiz+9eVEaVMlE2Fk3j7EResM3YHnECZUH7BONNTjpy7RVNi/YimGuNYriC7Cmswv4PNYiFYzw9QhlqZKwNfCM6IUpFZ0T4rZx8G78zkv2tNVbfYC4qNQedGi07nWZ33dlSuVxROVfY5JxOWHMI0=*&zvdvdvddbfikkkumtmdwqppp?|4Y!s!2br`;
        const signature2 = md5(signature);

        const body = `token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79&token_id=&phone_type=1&time=${timestamp}&phone_model=xiaomi-22021211rc&keys=ZH8gpdp9bxjuG2NK97sol3o7Uiz%2B9eVEaVMlE2Fk3j7EResM3YHnECZUH7BONNTjpy7RVNi%2FYimGuNYriC7Cmswv4PNYiFYzw9QhlqZKwNfCM6IUpFZ0T4rZx8G78zkv2tNVbfYC4qNQedGi07nWZ33dlSuVxROVfY5JxOWHMI0%3D&request_key=${request_key2}&signature=${signature2}&app_id=1&ad_version=1`;

        const headers = {
            'Cache-Control': 'no-cache',
            'Version': '2406025',
            'PackageName': 'com.uf076bf0c246.qe439f0d5e.m8aaf56b725a.ifeb647346f',
            'Ver': '1.9.2',
            'Referer': 'https://api.8utdtcq.com',
            'X-Customer-Client-Ip': '127.0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'api.8utdtcq.com',
            'Connection': 'Keep-Alive',
            'User-Agent': 'okhttp/3.12.0'
        };

        const res = fetch(rule.host + '/App/Resource/VurlDetail/showOne', {
            method: 'POST', headers, body, rejectCoding: true
        });
        const data = JSON.parse(res).data;
        const response_key = data.response_key;
        const keys = data.keys;
        const bodykeyiv = JSON.parse(RSA.decode(keys, rule._rsaPublicKey));
        const key = CryptoJS.enc.Utf8.parse(bodykeyiv.key);
        const iv = CryptoJS.enc.Utf8.parse(bodykeyiv.iv);
        const html = rule._decrypt(response_key, key, iv);
        const realUrl = JSON.parse(html).url;

        input = { url: realUrl, parse: 0 };
    }),

    // ========== 搜索 ==========
    搜索: $js.toString(() => {
        let d = [];
        const keyword = input.split('#')[1];
        const timestamp = Math.floor(Date.now() / 1000);

        const reqData = { keywords: keyword, order_val: "1" };
        const request_key = JSON.stringify(reqData);
        const request_key2 = rule._encrypt(request_key);

        const signature = `token_id=,token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79,phone_type=1,request_key=${request_key2},app_id=1,time=${timestamp},keys=qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ+IOJyHnHflCj5w/7ESK7FgywMvrgjxbx0GklEFLI4+JshgySe633OIRstuktwdiCy3CT+fLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz/uurUif2OK4=*&zvdvdvddbfikkkumtmdwqppp?|4Y!s!2br`;
        const signature2 = md5(signature);
        const body = `token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79&token_id=&phone_type=1&time=${timestamp}&phone_model=xiaomi-22021211rc&keys=qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ%2BIOJyHnHflCj5w%2F7ESK7FgywMvrgjxbx0GklEFLI4%2BJshgySe633OIRstuktwdiCy3CT%2BfLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz%2FuurUif2OK4%3D&request_key=${request_key2}&signature=${signature2}&app_id=1&ad_version=1`;

        const headers = {
            'Cache-Control': 'no-cache',
            'Version': '2406025',
            'PackageName': 'com.uf076bf0c246.qe439f0d5e.m8aaf56b725a.ifeb647346f',
            'Ver': '1.9.2',
            'Referer': 'https://api.8utdtcq.com',
            'X-Customer-Client-Ip': '127.0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'api.8utdtcq.com',
            'Connection': 'Keep-Alive',
            'User-Agent': 'okhttp/3.12.0'
        };

        const res = fetch(rule.host + rule.searchUrl.split('#')[0], {
            method: 'POST', headers, body, rejectCoding: true
        });
        const data = JSON.parse(res).data;
        const response_key = data.response_key;
        const keys = data.keys;
        const bodykeyiv = JSON.parse(RSA.decode(keys, rule._rsaPublicKey));
        const key = CryptoJS.enc.Utf8.parse(bodykeyiv.key);
        const iv = CryptoJS.enc.Utf8.parse(bodykeyiv.iv);
        const html = rule._decrypt(response_key, key, iv);
        const list = JSON.parse(html).list || [];

        list.forEach(item => {
            d.push({
                title: item.vod_name,
                desc: item.vod_continu == 0 ? '电影' : `更新至${item.vod_continu}集`,
                content: item.vod_addtime || '',
                img: item.vod_pic,
                url: `${item.vod_id}/${item.vod_continu}`
            });
        });

        setResult(d);
    })
};