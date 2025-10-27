/*
@header({
  searchable: 2,
  quickSearch: 1,
  filterable: 0,
  title: 'SeedHub',
  '类型': '影视',
  lang: 'zh'
})
*/

var rule = {
  title: '美好TV',
  host: 'https://seedhub.pro',
  homeUrl: '/',
  url: '/categories/{cateId}/movies/?page={catePg}',
  searchUrl: '/s/{wd}/',
  searchable: 2,
  quickSearch: 1,
  filterable: 0,

  class_name: '电影&动漫&剧集',
  class_url: '1&2&3',

  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  // 一级：列表页解析（优化封面提取）
  一级: async function (html, cateId, pg) {
    let items = [];
    let covers = pdfa(html, 'div.cover-container > div.cover');
    for (const item of covers) {
      let title = pd(item, 'h2&&Text')?.replace('#', '').trim();
      if (!title) continue;

      // 优化：优先 data-src，回退 src，trim 并校验
      let img = pd(item, 'img&&data-src')?.trim() || pd(item, 'img&&src')?.trim() || '';
      if (img && !img.startsWith('http')) {
        img = this.host + img;
      }

      let desc = '';
      let lis = pdfa(item, 'ul li');
      if (lis.length >= 2) {
        desc = lis[1].text.trim();
      }
      let id = pd(item, 'a.image&&href')?.trim();
      if (id) {
        items.push({
          vod_id: id,
          vod_name: title,
          vod_pic: img,
          vod_remarks: desc
        });
      }
    }
    return items;
  },

  // 二级：详情页解析（优化封面提取）
  二级: async function (html, id) {
    let vod_name = pd(html, 'h1&&Text') || '未知影片';

    // 优化封面提取：优先 data-src，回退 src
    let img = pd(html, 'div.cover-container img&&data-src')?.trim() ||
              pd(html, 'div.cover-container img&&src')?.trim() || '';

    if (img && !img.startsWith('http')) {
      img = this.host + img;
    }

    let urls = [];
    let panLinks = pdfa(html, 'ul.pan-links a[rel="nofollow"]');
    for (const a of panLinks) {
      let text = pd(a, '&&Text').trim();
      let href = pd(a, '&&data-link');
      if (href && href.startsWith('http')) {
        urls.push(text + '$' + href);
      }
    }

    if (urls.length === 0) {
      let magnetLinks = pdfa(html, 'ul.seeds a[rel="nofollow"]');
      for (const a of magnetLinks) {
        let text = pd(a, '&&Text').trim();
        let href = pd(a, '&&href');
        if (href) {
          urls.push(text + '$' + this.host + href);
        }
      }
    }

    return {
      vod_id: id,
      vod_name: vod_name,
      vod_pic: img,
      vod_play_from: urls.length > 0 ? 'SeedHub' : '无资源',
      vod_play_url: urls.length > 0 ? urls.join('#') : '暂无可用链接'
    };
  },

  搜索: async function (html, wd) {
    return this.一级(html, '', 1);
  },

  lazy: async function (flag, id, flags) {
    return { parse: 0, url: id };
  }
};