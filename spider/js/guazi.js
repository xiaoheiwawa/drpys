/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 1,
  title: '瓜子影视',
  lang: 'ds'
})
*/

var rule = {
  title: '瓜子影视',
  host: 'https://api.8utdtcq.com',
  url: '/App/IndexList/indexList',
  searchUrl: '/App/Index/findMoreVod#**',
  class_name: '电影&电视剧&动漫&综艺&短剧',
  class_url: '1&2&4&3&64',
  searchable: 2,
  quickSearch: 1,
  filterable: 1,
  play_parse: true,
  timeout: 8000,

  // ========== 全局请求头 ==========
  headers: {
    'Cache-Control': 'no-cache',
    'Version': '2406025',
    'PackageName': 'com.uf076bf0c246.qe439f0d5e.m8aaf56b725a.ifeb647346f',
    'Ver': '1.9.2',
    'X-Customer-Client-Ip': '127.0.0.1',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Connection': 'Keep-Alive',
    'User-Agent': 'okhttp/3.12.0'
  },

  // ========== RSA 解密用的公钥（固定）==========
  bodykey: "MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGAe6hKrWLi1zQmjTT1ozbE4QdFeJGNxubxld6GrFGximxfMsMB6BpJhpcTouAqywAFppiKetUBBbXwYsYU1wNr648XVmPmCMCy4rY8vdliFnbMUj086DU6Z+/oXBdWU3/b1G0DN3E9wULRSwcKZT3wj/cCI1vsCm3gj2R5SqkA9Y0CAwEAAQKBgAJH+4CxV0/zBVcLiBCHvSANm0l7HetybTh/j2p0Y1sTXro4ALwAaCTUeqdBjWiLSo9lNwDHFyq8zX90+gNxa7c5EqcWV9FmlVXr8VhfBzcZo1nXeNdXFT7tQ2yah/odtdcx+vRMSGJd1t/5k5bDd9wAvYdIDblMAg+wiKKZ5KcdAkEA1cCakEN4NexkF5tHPRrR6XOY/XHfkqXxEhMqmNbB9U34saTJnLWIHC8IXys6Qmzz30TtzCjuOqKRRy+FMM4TdwJBAJQZFPjsGC+RqcG5UvVMiMPhnwe/bXEehShK86yJK/g/UiKrO87h3aEu5gcJqBygTq3BBBoH2md3pr/W+hUMWBsCQQChfhTIrdDinKi6lRxrdBnn0Ohjg2cwuqK5zzU9p/N+S9x7Ck8wUI53DKm8jUJE8WAG7WLj/oCOWEh+ic6NIwTdAkEAj0X8nhx6AXsgCYRql1klbqtVmL8+95KZK7PnLWG/IfjQUy3pPGoSaZ7fdquG8bq8oyf5+dzjE/oTXcByS+6XRQJAP/5ciy1bL3NhUhsaOVy55MHXnPjdcTX0FaLi+ybXZIfIQ2P4rb19mVq1feMbCXhz+L1rG8oat5lYKfpe8k83ZA==",

  // ========== AES 加密 ==========
  encrypt: function (plainText) {
    const key = CryptoJS.enc.Utf8.parse("mvXBSW7ekreItNsT");
    const iv = CryptoJS.enc.Utf8.parse("2U3IrJL8szAKp0Fj");
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
  },

  // ========== AES 解密 ==========
  decrypt: function (hexStr, keyStr, ivStr) {
    const key = CryptoJS.enc.Utf8.parse(keyStr);
    const iv = CryptoJS.enc.Utf8.parse(ivStr);
    const encryptedHex = CryptoJS.enc.Hex.parse(hexStr);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedHex }, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  },

  // ========== 通用 API 请求（自动签名 + 加密 + 解密）==========
  apiRequest: async function (path, requestObj, keysSig) {
    const t = Math.floor(Date.now() / 1000).toString();
    const requestKeyEnc = this.encrypt(JSON.stringify(requestObj));
    const signatureRaw = `token_id=,token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79,phone_type=1,request_key=${requestKeyEnc},app_id=1,time=${t},keys=${keysSig}`;
    const signature = md5(signatureRaw);

    const body = `token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79&token_id=&phone_type=1&time=${t}&phone_model=xiaomi-22011111rc&keys=${encodeURIComponent(keysSig)}&request_key=${requestKeyEnc}&signature=${signature}&app_id=1&ad_version=1`;

    const res = await request(this.host + path, {
      method: 'POST',
      headers: this.headers,
      body: body
    });

    const data = JSON.parse(res).data;
    const bodykeyiv = JSON.parse(RSA.decode(data.keys, this.bodykey));
    return this.decrypt(data.response_key, bodykeyiv.key, bodykeyiv.iv);
  },

  // ========== 一级分类 ==========
  一级: async function (tid, pg, filter, extend) {
    const subMap = { '1': '5', '2': '12', '4': '30', '3': '22', '64': '' };
    const req = {
      area: (extend?.area || 0).toString(),
      sub: (extend?.sub || subMap[tid] || '').toString(),
      year: (extend?.year || 0).toString(),
      pageSize: "30",
      sort: (extend?.sort || "d_id").toString(),
      page: pg,
      tid: tid
    };
    const keysSig = "qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ+IOJyHnHflCj5w/7ESK7FgywMvrgjxbx0GklEFLI4+JshgySe633OIRstuktwdiCy3CT+fLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz/uurUif2OK4=*";
    const json = await this.apiRequest('/App/IndexList/indexList', req, keysSig);
    const list = JSON.parse(json).list || [];

    const d = list.map(item => ({
      title: item.vod_name,
      desc: item.vod_continu == 0 ? '电影' : `更新至${item.vod_continu}集`,
      img: item.vod_pic,
      url: `${item.vod_id}/${item.vod_continu}`
    }));
    return setResult(d);
  },

  // ========== 搜索 ==========
  搜索: async function (wd, quick, pg) {
    const req = { keywords: wd, order_val: "1" };
    const keysSig = "qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ+IOJyHnHflCj5w/7ESK7FgywMvrgjxbx0GklEFLI4+JshgySe633OIRstuktwdiCy3CT+fLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz/uurUif2OK4=*";
    const json = await this.apiRequest('/App/Index/findMoreVod', req, keysSig);
    const list = JSON.parse(json).list || [];

    const d = list.map(item => ({
      title: item.vod_name,
      desc: item.vod_continu == 0 ? '电影' : `更新至${item.vod_continu}集`,
      img: item.vod_pic,
      url: `${item.vod_id}/${item.vod_continu}`
    }));
    return setResult(d);
  },

  // ========== 二级详情 ==========
  二级: async function (ids) {
    const [vod_id] = ids[0].split('/');
    const req1 = {
      token_id: "393668",
      vod_id: vod_id,
      mobile_time: Math.floor(Date.now() / 1000),
      token: "1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79"
    };
    const keysSig1 = "Qmxi5ciWXbQzkr7o+SUNiUuQxQEf8/AVyUWY4T/BGhcXBIUz4nOyHBGf9A4KbM0iKF3yp9M7WAY0rrs5PzdTAOB45plcS2zZ0wUibcXuGJ29VVGRWKGwE9zu2vLwhfgjTaaDpXo4rby+7GxXTktzJmxvneOUdYeHi+PZsThlvPI=*";
    const infoJson = await this.apiRequest('/App/IndexPlay/playInfo', req1, keysSig1);
    const vodInfo = JSON.parse(infoJson).vodInfo;

    const req2 = { vurl_cloud_id: "2", vod_d_id: vod_id };
    const playJson = await this.apiRequest('/App/Resource/Vurl/show', req2, keysSig1);
    const playList = JSON.parse(playJson).list || [];

    const urls = [];
    playList.forEach(item => {
      const playParams = Object.values(item.play);
      let lastParam = null;
      for (let i = playParams.length - 1; i >= 0; i--) {
        if (playParams[i].param) {
          lastParam = playParams[i].param;
          break;
        }
      }
      const vurlIdMatch = lastParam?.match(/vurl_id=(\d+)/);
      const resMatch = lastParam?.match(/resolution=(\d+)/);
      if (vurlIdMatch) {
        urls.push(`${item.title}$${vod_id}/${vurlIdMatch[1]}?${resMatch?.[1] || '1080'}`);
      }
    });

    return {
      vod_id: vod_id,
      vod_name: vodInfo.vod_name,
      vod_pic: vodInfo.vod_pic,
      type_name: Array.isArray(vodInfo.videoTag) ? vodInfo.videoTag.join(',') : '',
      vod_year: vodInfo.vod_year || '',
      vod_area: vodInfo.vod_area || '',
      vod_actor: vodInfo.vod_actor || '',
      vod_director: vodInfo.vod_director || '',
      vod_content: vodInfo.vod_use_content || '',
      vod_play_from: '瓜子HD',
      vod_play_url: urls.join('#')
    };
  },

  // ========== 播放解析（lazy）==========
  lazy: async function (flag, id, flags) {
    const [vod_id, vurlPart] = id.split('/');
    const [vurl_id, resolution = '1080'] = (vurlPart || '').split('?');

    const req = {
      domain_type: "8",
      vod_id: vod_id,
      type: "play",
      resolution: resolution,
      vurl_id: vurl_id
    };
    const keysSig = "ZH8gpdp9bxjuG2NK97sol3o7Uiz+9eVEaVMlE2Fk3j7EResM3YHnECZUH7BONNTjpy7RVNi/YimGuNYriC7Cmswv4PNYiFYzw9QhlqZKwNfCM6IUpFZ0T4rZx8G78zkv2tNVbfYC4qNQedGi07nWZ33dlSuVxROVfY5JxOWHMI0=*";
    const json = await this.apiRequest('/App/Resource/VurlDetail/showOne', req, keysSig);
    const playUrl = JSON.parse(json).url;

    return { parse: 0, url: playUrl };
  }
};