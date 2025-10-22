/*
@header({
  searchable: 2,
  quickSearch: 1,
  filterable: 1,
  title: 'SeedHub',
  lang: 'zh'
})
*/

var rule = {
  title: 'SeedHub',
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

  // 一级：列表页解析
  一级: async function (html, cateId, pg) {
    let items = [];
    let covers = pdfa(html, 'div.cover');
    covers.forEach(item => {
      let title = pd(item, 'h2&&Text').replace('#', '').trim();
      let img = pd(item, 'img&&src');
      let desc = '';
      let lis = pdfa(item, 'ul li');
      if (lis.length >= 2) {
        desc = lis[1].text.trim(); // 年份/地区/语言
      }
      let id = pd(item, 'a.image&&href');
      if (id && title) {
        items.push({
          vod_id: id,
          vod_name: title,
          vod_pic: img,
          vod_remarks: desc
        });
      }
    });
    return items;
  },

  // 二级：详情页解析 → 提取所有网盘链接
  二级: async function (html, id) {
    let vod = {};
    vod.vod_id = id;
    vod.vod_name = pd(html, 'h1&&Text') || '未知影片';
    vod.vod_pic = pd(html, 'div.cover-container img&&src');

    // 提取所有网盘链接（夸克、百度、阿里、UC 等）
    let panLinks = pdfa(html, 'ul.pan-links a[rel="nofollow"]');
    let urls = [];
    panLinks.forEach(a => {
      let text = pd(a, '&&Text').trim();
      let href = pd(a, '&&data-link'); // 关键：真实网盘地址在 data-link
      if (href && href.startsWith('http')) {
        urls.push(text + '$' + href);
      }
    });

    // 如果没有网盘，尝试提取磁力跳转链接（备用）
    if (urls.length === 0) {
      let magnetLinks = pdfa(html, 'ul.seeds a[rel="nofollow"]');
      magnetLinks.forEach(a => {
        let text = pd(a, '&&Text').trim();
        let href = pd(a, '&&href');
        if (href) {
          urls.push(text + '$' + 'https://seedhub.pro' + href);
        }
      });
    }

    if (urls.length > 0) {
      vod.vod_play_from = 'SeedHub';
      vod.vod_play_url = urls.join('#');
    } else {
      vod.vod_play_from = '无资源';
      vod.vod_play_url = '暂无可用链接';
    }

    return vod;
  },

  // 搜索
  搜索: async function (html, wd) {
    return this.一级(html, '', 1);
  },

  // 懒加载：直接返回网盘链接，由 TVBox 嗅探或跳转
  lazy: async function (flag, id, flags) {
    // id 是网盘地址（如 https://pan.quark.cn/...）
    return { parse: 0, url: id };
  }
};