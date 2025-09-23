/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '飘雪影院',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  lang: 'ds'
})
*/

var rule = {
  类型: '影视',
  title: '飘雪影院',
  author: '不告诉你',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  host: 'https://www.yjmyston.com',
  url: '/pxyyshow/fyclass--------fypage---.html',
  searchUrl: '/pxyysearch/**----------fypage---.html',
  searchable: 1, quickSearch: 1, double: true, timeout: 10000, play_parse: true, filterable: 1, invalid: true,

  推荐: async function (tid, pg, filter, extend) {
    const homeFn = rule.一级.bind(this);
    return await homeFn();
  },

  一级: async function () {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);
    let d = [];
    // 影片列表容器
    let data = pdfa(html, '.a-con-inner');
    data.forEach((it) => {
      d.push({
        title: pdfh(it, '.s1 a&&Text'),
        pic_url: pd(it, '.pic img&&data-src'), // 图片懒加载属性
        desc: pdfh(it, '.s2&&Text'), // 类型标签
        url: pd(it, '.pic a&&href'),
      })
    });
    return setResult(d)
  },

  二级: async function (ids) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);
    let VOD = {};

    VOD.vod_name = pdfh(html, '.info .p1 .tit&&Text'); // 影片名称
    VOD.vod_pic = pd(html, '.info .pic img&&data-src'); // 海报
    VOD.vod_content = pdfh(html, '.info .p2 .juqing #articleText&&Text'); // 简介

    // 导演和主演
    VOD.vod_director = pdfh(html, '.info .p2 .daoyan&&Text').replace('导演：', '').trim();
    VOD.vod_actor = pdfh(html, '.info .p2 .zhuyan&&Text').replace('主演：', '').trim();
    VOD.vod_remarks = pdfh(html, '.info .p2 .zhuangtai&&Text').replace('状态：', '').trim();

    // 提取播放源和剧集列表
    // 在飘雪影院，播放源通常是固定的，直接从播放链接中提取
    let playList = pdfa(html, '.info .p1 .play a');
    let playmap = {};

    if (playList.length > 0) {
      const from = '飘雪播放'; // 由于页面没有明确的播放源标签，我们自定义一个
      playmap[from] = [];

      playList.forEach((it) => {
        let title = '立即播放'; // 详情页通常只有一个“立即播放”按钮
        let url = pd(it, 'a&&href', input);
        playmap[from].push(title + "$" + url);
      });
    }

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
    let data = pdfa(html, '.a-con-inner');
    data.forEach((it) => {
      d.push({
        title: pdfh(it, '.s1 a&&Text'),
        pic_url: pd(it, '.pic img&&data-src'),
        desc: pdfh(it, '.s2&&Text'),
        url: pd(it, '.pic a&&href'),
      })
    });
    return setResult(d);
  },

  lazy: async function (flag, id, flags) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await request(input);

    // 尝试匹配通用的 player_ 变量
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

  // 筛选URL格式
  filter_url: '{{fl.地区}}-{{fl.sort}}-{{fl.剧情}}-----fypage---{{fl.年份}}',

  // 动态获取分类和筛选条件
  class_parse: async function () {
    const { input, pdfa, pdfh, pd } = this;
    const filters = {};
    const html = await request(input, { headers: this.headers, timeout: this.timeout });

    // 解析顶部导航栏的分类
    // 飘雪影院的分类链接格式为: /pxyy/1.html, /pxyy/dianshiju.html 等
    const data = pdfa(html, ".nav a");
    const classes = data
      .map((it) => {
        const href = pdfh(it, "a&&href");
        // 从 href="/pxyy/1.html" 中提取 "1"，或从 "/pxyy/dianshiju.html" 中提取 "dianshiju"
        const type_id = href.replace(/\/pxyy\/(.*).html/g, "$1");
        const type_name = pdfh(it, "a&&Text");
        // 过滤掉“首页”、“短剧”等非核心影视分类或重复项
        if (["首页", "短剧", "null", ""].includes(type_name)) return null;
        if (!type_id || !type_name) return null;
        return { type_id, type_name };
      })
      .filter(Boolean);

    // 为每个分类抓取其筛选条件页面
    const htmlUrl = classes.map((item) => ({
      url: `${this.host}/pxyyshow/${item.type_id}--------1---.html`,
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