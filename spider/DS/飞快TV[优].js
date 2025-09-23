/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '飞快TV',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  lang: 'ds'
})
*/

var rule = {
  类型: '影视',
  title: '飞快TV',
  author: '不告诉你',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  host: 'https://feikuai.tv',
  url: '/vodshow/fyclass-fyfilter.html',
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
    // 根据飞快TV的HTML结构，影片列表的容器是 '.module-items .module-poster-item'
    let data = pdfa(html, '.module-items .module-poster-item');
    data.forEach((it) => {
      d.push({
        title: pdfh(it, 'a&&title'),
        pic_url: pd(it, '.lazyload&&data-original'), // 图片懒加载属性
        desc: pdfh(it, '.module-item-note&&Text'), // 备注信息，如“HD”、“更新至XX集”
        url: pd(it, 'a&&href'),
      })
    });
    return setResult(d)
  },

  二级: async function (ids) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);
    let VOD = {};

    VOD.vod_name = pdfh(html, 'h1&&Text'); // 影片名称
    // 导演和主演在详情页的结构是固定的，直接通过索引获取
    VOD.vod_director = pdfh(html, '.module-info-item:eq(1) .module-info-item-content&&Text').replace(/\s*\/\s*$/, '').trim();
    VOD.vod_actor = pdfh(html, '.module-info-item:eq(3) .module-info-item-content&&Text').replace(/\s*\/\s*$/, '').trim();
    VOD.vod_remarks = pdfh(html, '.module-info-item:eq(4) .module-info-item-content&&Text'); // 更新时间
    VOD.vod_content = pdfh(html, '.module-info-introduction-content&&Text'); // 简介

    // 提取播放源和剧集列表
    // 播放列表容器: '#y-playList .module-tab-item'
    // 剧集列表容器: '.module-play-list .module-play-list-link'
    let tabs = pdfa(html, '#y-playList .module-tab-item');
    let playlist = pdfa(html, '.module-play-list');

    let playmap = {};
    tabs.map((item, i) => {
      const from = pdfh(item, 'span&&Text'); // 播放源名称，如“超清”、“高清①”
      const list = playlist[i]; // 对应的剧集列表
      const a = pdfa(list, 'a');

      a.map((it) => {
        let title = pdfh(it, 'span&&Text'); // 剧集标题
        let url = pd(it, 'a&&href', input); // 剧集播放页链接
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
    // 搜索结果的容器结构与一级列表页相同
    let data = pdfa(html, '.module-items .module-poster-item');
    data.forEach((it) => {
      d.push({
        title: pdfh(it, 'a&&title'),
        pic_url: pd(it, '.lazyload&&data-original'),
        desc: pdfh(it, '.module-item-note&&Text'),
        url: pd(it, 'a&&href'),
      })
    });
    return setResult(d);
  },

  lazy: async function (flag, id, flags) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);

    // 根据飞快TV的播放页JS，播放信息通常存储在 `player_` 开头的变量中
    let match = html.match(/r player_.*?=(.*?)</);
    if (!match) {
      // 如果匹配失败，直接返回原始链接，交由播放器处理
      return { parse: 0, url: input };
    }

    let playerData = JSON.parse(match[1]);
    let url = playerData.url;

    // 处理加密的URL
    if (playerData.encrypt == "1") {
      url = unescape(url);
      return { parse: 0, url: url };
    } else if (playerData.encrypt == "2") {
      url = unescape(base64Decode(url));
      return { parse: 0, url: url };
    }

    // 如果是直接的视频链接，则直接返回
    if (/m3u8|mp4/.test(url)) {
      return { parse: 0, url: url };
    } else {
      return { parse: 0, url: input };
    }
  },

  // 筛选URL格式，根据飞快TV的URL结构定义
  filter_url: '{{fl.地区}}-{{fl.sort}}-{{fl.剧情}}-----fypage---{{fl.年份}}',

  // 动态获取分类和筛选条件
  class_parse: async function () {
    const { input, pdfa, pdfh, pd } = this;
    const filters = {};
    const html = await request(input, { headers: this.headers, timeout: this.timeout });

    // 解析顶部导航栏的分类
    const data = pdfa(html, ".navbar .navbar-item a.links");
    const classes = data
      .map((it) => {
        const type_id = pdfh(it, "a&&href").replace(/\/vodtype\/(.*).html/g, "$1");
        const type_name = pdfh(it, "span&&Text");
        // 过滤掉非影视分类，如“首页”、“片单”、“APP”等
        if (["首页", "片单", "热播", "更新", "APP", "null"].includes(type_name)) return null;
        if (!type_id || !type_name) return null;
        return { type_id, type_name };
      })
      .filter(Boolean);

    // 为每个分类抓取其筛选条件页面
    const htmlUrl = classes.map((item) => ({
      url: `${this.host}/vodshow/${item.type_id}-----------.html`,
      options: { timeout: this.timeout, headers: this.headers },
    }));

    const htmlArr = await batchFetch(htmlUrl);
    htmlArr.map((it, i) => {
      const type_id = classes[i].type_id;
      // 筛选条件容器: '.module-class-items'
      const data = pdfa(it, ".module-class-items");
      const categories = [
        { key: "剧情", name: "剧情" },
        { key: "地区", name: "地区" },
        { key: "年份", name: "年份" },
        { key: "by", name: "排序" }, // 飞快TV的排序参数是 'by'
      ];

      filters[type_id] = categories
        .map((category) => {
          // 找到对应名称的筛选块
          const filteredData = data.filter((item) => pdfh(item, ".module-item-title&&Text") === category.name)[0] || [];
          if (filteredData.length === 0) return null;

          // 提取该筛选块下的所有选项
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