/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '毒舌影视',
  lang: 'ds'
})
*/

var rule = {
  title: 'snake',
  host: 'https://www.xnhrsb.com',
  url: '/dsshiyisw/fyclass--------fypage---.html',
  searchUrl: '/dsshiyisc/**----------fypage---.html',
  class_name: '电影&电视剧&综艺&动漫&短剧&豆瓣',
  class_url: '1&2&3&4&5&duoban',
  searchable: 2,
  quickSearch: 0,
  filterable: 0,
  play_parse: true,
  timeout: 5000,

  // ========== 推荐 ==========
  推荐: async function (tid, pg, filter, extend) {
    const { input, pdfa, pdfh } = this;
    const html = await request(input);
    const items = pdfa(html, '.bt_img ul li');
    const d = [];
    items.forEach((item) => {
      d.push({
        title: pdfh(item, '.dytit&&Text'),
        pic_url: pdfh(item, '.lazy&&data-original'),
        desc: pdfh(item, '.hdinfo&&Text'),
        url: pdfh(item, 'a&&href'),
      });
    });
    return setResult(d);
  },

  // ========== 一级列表 ==========
  一级: async function (tid, pg, filter, extend) {
    const { input, pdfa, pdfh } = this;
    const html = await request(input);
    const items = pdfa(html, '.mrb ul li');
    const d = [];
    items.forEach((item) => {
      d.push({
        title: pdfh(item, '.dytit&&Text'),
        pic_url: pdfh(item, '.lazy&&data-original'),
        desc: pdfh(item, '.hdinfo&&Text'),
        url: pdfh(item, 'a&&href'),
      });
    });
    return setResult(d);
  },

  // ========== 二级详情 ==========
  二级: async function (ids) {
    const { input, pdfa, pdfh } = this;
    const url = ids[0].startsWith('http') ? ids[0] : this.host + ids[0];
    const html = await request(url);

    const vod = {
      vod_id: ids[0],
      vod_name: pdfh(html, 'h1&&Text') || '未知影片',
      vod_pic: pdfh(html, 'div.dyimg img&&src'),
      vod_content: pdfh(html, '.yp_context&&Text') || '',
      vod_remarks: pdfh(html, '.moviedteail_list li:eq(3)&&Text') || '',
      type_name: pdfh(html, '.moviedteail_list li:eq(0) a&&Text') || ''
    };

    // 提取详情信息（导演、主演、年份、地区、语言）
    const detailList = pdfa(html, '.moviedteail_list li');
    const details = {};
    detailList.forEach(li => {
      const text = pdfh(li, '&&Text');
      if (text.includes('导演：')) details.director = text.replace('导演：', '');
      if (text.includes('主演：')) details.actor = text.replace('主演：', '');
      if (text.includes('年份：')) details.year = text.replace('年份：', '');
      if (text.includes('地区：')) details.area = text.replace('地区：', '');
      if (text.includes('语言：')) details.lang = text.replace('语言：', '');
    });

    vod.vod_actor = details.actor || '';
    vod.vod_director = details.director || '';
    vod.vod_year = details.year || '';
    vod.vod_area = details.area || '';
    vod.vod_lang = details.lang || '';

    // 播放源与分集
    const tabs = pdfa(html, '.mi_paly_box .ypxingq_t');
    const playFroms = [];
    const playUrls = [];

    tabs.forEach((tab, index) => {
      const fromName = pdfh(tab, '&&Text').trim() || `线路${index + 1}`;
      playFroms.push(fromName);

      const episodes = pdfa(html, `.paly_list_btn:eq(${index}) a:gt(0)`);
      const urls = episodes.map(ep => {
        const epName = pdfh(ep, '&&Text').trim();
        const epUrl = pdfh(ep, '&&href');
        return `${epName}$${epUrl}`;
      }).filter(Boolean);

      playUrls.push(urls.join('#'));
    });

    vod.vod_play_from = playFroms.join('$$$');
    vod.vod_play_url = playUrls.join('$$$');

    return vod;
  },

  // ========== 搜索 ==========
  搜索: async function (wd, quick, pg) {
    const { input, pdfa, pdfh } = this;
    const html = await request(input);
    const items = pdfa(html, '.mrb ul li');
    const d = [];
    items.forEach((item) => {
      d.push({
        title: pdfh(item, '.dytit&&Text'),
        pic_url: pdfh(item, '.lazy&&data-original'),
        desc: pdfh(item, '.hdinfo&&Text'),
        url: pdfh(item, 'a&&href'),
      });
    });
    return setResult(d);
  },

  // ========== 懒加载解析（播放）==========
  lazy: async function (flag, id, flags) {
    const { input, pdfh } = this;
    let html = await request(input);
    
    // 提取 iframe
    let ohtml = pdfh(html, '.videoplay&&Html');
    let iframeSrc = pdfh(ohtml, 'body&&iframe&&src');

    // 情况1：Cloud 或 pla.py1080p.com 加密
    if (/Cloud/.test(iframeSrc) || /pla\.py1080p\.com/.test(iframeSrc)) {
      let ifrwy = await request(iframeSrc);
      let codeMatch = ifrwy.match(/var\s+url\s*=\s*['"](.*?)['"]/);
      if (codeMatch) {
        let code = codeMatch[1].split('').reverse().join('');
        let temp = '';
        for (let i = 0; i < code.length; i += 2) {
          temp += String.fromCharCode(parseInt(code[i] + code[i + 1], 16));
        }
        let realUrl = temp.substring(0, (temp.length - 7) / 2) + temp.substring((temp.length - 7) / 2 + 7);
        return { parse: 0, url: realUrl };
      }
    }

    // 情况2：decrypted 脚本（需 CryptoJS）
    if (/decrypted/.test(ohtml)) {
      let phtml = pdfh(ohtml, "body&&script:not([src])&&Html");
      if (typeof getCryptoJS === 'function') {
        eval(getCryptoJS());
        let scrpt = phtml.match(/var.*?\\)\\);/g)?.[0];
        if (scrpt) {
          let data = [];
          eval(scrpt.replace(/md5/g, 'CryptoJS').replace('eval', 'data = '));
          let urlMatch = data.match(/url:\s*['"](.*?)['"]/);
          if (urlMatch) {
            return { parse: 0, url: urlMatch[1] };
          }
        }
      }
    }

    // 默认：直接返回 iframeSrc（或原页）
    if (iframeSrc && iframeSrc.startsWith('http')) {
      return { parse: 1, url: iframeSrc };
    }

    return { parse: 1, url: input };
  }
};