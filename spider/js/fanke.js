var rule = {
  title: '凡客TV',
  host: 'https://fktv.me',
  homeUrl: '/',
  // 分类页 URL 模板
  url: '/channel?page=fypage&cat_id=fyclass&order=new&page_size=32',
  class_name: '电影&电视剧&动漫&综艺',
  class_url: '1&2&4&3',
  searchUrl: '/search?text=**&page=fypage',
  searchable: 2,
  quickSearch: 0,
  filterable: 0,

  // 一级目录：分类或首页列表
  一级: async function (tid, pg) {
    let url = rule.host + rule.url
      .replace('fyclass', tid)
      .replace('fypage', pg);
    let html = await request(url);
    let items = pdfa(html, '.video-wrap .list-wrap .item-wrap');
    let d = items.map(it => ({
      title: pdfh(it, '.meta-wrap a&&Text'),
      pic_url: pdfh(it, '.normal-wrap .bg-cover&&data-src'),
      desc: pdfh(it, '.meta-wrap .category&&Text'),
      url: pdfh(it, '.meta-wrap a&&href')
    }));
    return setResult(d);
  },

  // 二级目录：影片详情页
  二级: async function (url) {
    let html = await request(rule.host + url);
    let title = pdfh(html, '.player .title&&Text');
    let pic = pdfh(html, '.player .poster img&&data-src');
    let desc = pdfh(html, '.player .video-info&&Text');
    let tabs = pdfa(html, '.source-item');
    let lists = [];

    for (let i = 0; i < tabs.length; i++) {
      let tabHtml = pdfh(tabs[i], 'body&&Html');
      let list = pdfa(tabHtml, '.play-list a');
      let urls = list.map(a => {
        let name = pdfh(a, 'a&&Text');
        let href = pdfh(a, 'a&&href');
        return name + '$' + href;
      });
      lists.push(urls.join('#'));
    }

    return {
      title: title,
      img: pic,
      desc: desc,
      tabs: tabs.map(t => pdfh(t, '.source-tab&&Text')),
      lists: lists
    };
  },

  // 搜索模块
  搜索: async function (key, pg) {
    let html = await request(rule.host + rule.searchUrl.replace('**', key).replace('fypage', pg));
    let items = pdfa(html, '.video-wrap .list-wrap .item-wrap');
    let d = items.map(it => ({
      title: pdfh(it, '.meta-wrap a&&Text'),
      pic_url: pdfh(it, '.normal-wrap .bg-cover&&data-src'),
      desc: pdfh(it, '.meta-wrap .category&&Text'),
      url: pdfh(it, '.meta-wrap a&&href')
    }));
    return setResult(d);
  },

  // 懒加载（播放）
  lazy: async function (flag, id, flags) {
    // id 是详情页中提取的 href
    return { parse: 1, url: rule.host + id };
  }
};
