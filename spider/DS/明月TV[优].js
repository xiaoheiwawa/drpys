/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '明月影视',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  lang: 'ds'
})
*/

var rule = {
  类型: '影视',
  title: '明月',
  author: '不告诉你',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  host: 'https://cnotv.com',
  url: '/vodshow/fyclass--------fypage---.html',
  searchUrl: '/vodsearch/**----------fypage---.html',
  searchable: 1, quickSearch: 1, double: true, timeout: 10000, play_parse: true, filterable: 1, invalid: true,

  推荐: async function (tid, pg, filter, extend) {
    const homeFn = rule.一级.bind(this);
    return await homeFn();
  },

  一级: async function () {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);
    let d = [];
    let data = pdfa(html, '.module-item');
    data.forEach((it) => {
      d.push({
        title: pdfh(it, '.module-item-title&&Text'),
        pic_url: pd(it, '.module-item-pic img&&data-src'),
        desc: pdfh(it, '.module-item-text&&Text'),
        url: pd(it, '.module-item-title&&href'),
      })
    });
    return setResult(d)
  },

  二级: async function (ids) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);
    let VOD = {};

    VOD.vod_name = pdfh(html, 'h1&&Text');
    // 从包含“导演：”、“主演：”的文本中提取纯净信息
    VOD.vod_director = pdfh(html, '.module-info-item:eq(1)&&Text').replace('导演：', '').trim();
    VOD.vod_actor = pdfh(html, '.module-info-item:eq(2)&&Text').replace('主演：', '').trim();
    VOD.vod_remarks = pdfh(html, '.module-info-item:eq(3)&&Text').replace('备注：', '').trim();
    VOD.vod_content = pdfh(html, '.module-info-introduction&&Text');

    // 核心修正：播放源和剧集列表的选择器
    // 播放源标签
    let tabs = pdfa(html, '.module-tab-item.tab-item');
    // 剧集列表容器
    let playlist = pdfa(html, '.module-play-list');

    let playmap = {};
    tabs.map((item, i) => {
      const from = pdfh(item, 'span&&Text');
      const list = playlist[i];
      if (!list) return;
      const a = pdfa(list, 'a');

      a.map((it) => {
        let title = pdfh(it, '&&Text'); // 剧集标题就是链接的文本
        let url = pd(it, 'a&&href', input);
        if (!playmap.hasOwnProperty(from)) {
          playmap[from] = [];
        }
        playmap[from].push(title + "$" + url);
      });
    });

    VOD.vod_play_from = Object.keys(playmap).join('$$$');
    const urls = Object.values(playmap);
    const playUrls = urls.map((urllist) => {
      return urllist.join("#");
    });
    VOD.vod_play_url = playUrls.join('$$$');

    return VOD;
  },

  搜索: async function (wd, quick, pg) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);
    let d = [];
    let data = pdfa(html, '.module-item');
    data.forEach((it) => {
      d.push({
        title: pdfh(it, '.module-item-title&&Text'),
        pic_url: pd(it, '.module-item-pic img&&data-src'),
        desc: pdfh(it, '.module-item-text&&Text'),
        url: pd(it, '.module-item-title&&href'),
      })
    });
    return setResult(d);
  },

  lazy: async function (flag, id, flags) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);

    let match = html.match(/r player_.*?=(.*?)</);
    if (!match) {
      return { parse: 0, url: input };
    }

    let playerData = JSON.parse(match[1]);
    let url = playerData.url;

    if (playerData.encrypt == "1") {
      url = unescape(url);
      return { parse: 0, url: url };
    } else if (playerData.encrypt == "2") {
      url = unescape(base64Decode(url));
      return { parse: 0, url: url };
    }

    if (/m3u8|mp4/.test(url)) {
      return { parse: 0, url: url };
    } else {
      return { parse: 0, url: input };
    }
  },

  filter_url: '{{fl.地区}}-{{fl.sort}}-{{fl.剧情}}-----fypage---{{fl.年份}}',

  class_parse: async function () {
    const { input, pdfa, pdfh, pd } = this;
    const filters = {};
    const html = await request(input, { headers: this.headers, timeout: this.timeout });

    // 核心修正：导航栏选择器和分类ID提取
    // 导航栏链接格式为: <a href="/vodtype/1.html" title="电影">
    const data = pdfa(html, ".nav-menu-item a");
    const classes = data
      .map((it) => {
        const href = pdfh(it, "a&&href");
        // 从 href="/vodtype/1.html" 中精确提取数字ID
        const type_id = href.match(/\/vodtype\/(\d+)\.html/)?.[1] || '';
        const type_name = pdfh(it, ".nav-menu-item-name&&Text") || pdfh(it, "span&&Text");
        // 过滤掉非影视分类
        if (["首页", "资讯", "null", ""].includes(type_name)) return null;
        if (!type_id || !type_name) return null;
        return { type_id, type_name };
      })
      .filter(Boolean);

    // 为每个分类抓取其筛选条件页面
    const htmlUrl = classes.map((item) => ({
      url: `${this.host}/vodshow/${item.type_id}--------1---.html`,
      options: { timeout: this.timeout, headers: this.headers },
    }));

    const htmlArr = await batchFetch(htmlUrl);
    htmlArr.map((it, i) => {
      const type_id = classes[i].type_id;
      const data = pdfa(it, ".module-class-items");
      const categories = [
        { key: "剧情", name: "剧情" },
        { key: "地区", name: "地区" },
        { key: "年份", name: "年份" },
        { key: "by", name: "排序" },
      ];

      filters[type_id] = categories
        .map((category) => {
          const filteredData = data.filter((item) => pdfh(item, ".module-item-title&&Text") === category.name)[0] || [];
          if (filteredData.length === 0) return null;

          const values = pdfa(filteredData, "a")
            .map((it) => {
              const nv = pdfh(it, "a&&Text");
              if (nv === category.name) return null;
              return {
                n: nv || "全部",
                v: nv === "全部" ? "" : nv,
              };
            })
            .filter(Boolean);

          return { key: category.key, name: category.name, value: values };
        })
        .filter(Boolean);
    });

    return { class: classes, filters };
  },
}