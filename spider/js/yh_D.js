/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '樱花动漫',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
  title: '樱花动漫',
  host: 'http://www.yinghuadm.cn',
  // 分类：手动指定（避免 class_parse 失败）
  class_name: '国产动漫&日本动漫&欧美动漫&动漫电影',
  class_url: '1&2&3&4',

  url: '/type/fyclass-fypage.html', // 苹果 CMS 标准格式
  searchUrl: '/search/**----------fypage---.html',
  
  searchable: 2,
  quickSearch: 0,
  filterable: 0,

  // 使用 mxpro 模板，但覆盖关键字段以确保兼容
  一级: 'body .stui-vodlist__box li;a&&title;.lazyload&&data-original;.pic-text&&Text;a&&href',
  二级: {
    title: 'h1&&Text;.stui-content__detail p:eq(0)&&Text',
    img: '.stui-content__thumb img&&data-original',
    desc: '.stui-content__detail p:eq(2)&&Text;.stui-content__detail p:eq(1)&&Text;;;.stui-content__detail p:eq(3)&&Text',
    content: '.stui-content__desc&&Text',
    tabs: '.stui-vodlist__head h3',
    lists: '.stui-content__playlist:eq(#id) li a'
  },

  lazy: '', // 通常无需解析，直接播放

  // 确保 User-Agent 正常
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};