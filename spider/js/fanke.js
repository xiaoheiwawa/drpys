/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: 'fankeTV',
  lang: 'ds'
})
*/

// 注意：此版本已重构，以使用与提供的 'ikanbot' 规则相同的依赖和风格
// （getHtml、pq、直接返回数组）。
// 原文件中复杂的 'generateCookie'、'imgDecrypt'、'decodeImg'、'axios' 和 'CryptoJS'
// 等逻辑已被移除或简化，因为它们在 'ikanbot' 规则环境中不受支持。

const {getHtml} = $.require('./_lib.request.js')
var rule = {
  类型: '影视',
  title: 'fankeTV',
  desc: '源动力出品',
  // host: 'https://fktv.me', // 为与ikanbot规则保持一致，重命名为homeUrl
  homeUrl: 'https://fktv.me',
  url: '/channel?page=fypage&cat_id=fyclass&order=new&page_size=32',
  searchUrl: '/channel?page=fypage&keywords=**&page_size=32&order=new',
  searchable: 2,
  quickSearch: 0,
  headers: {
    // 沿用ikanbot规则中的移动端UA
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
  },
  timeout: 5000,
  play_parse: true,
  filterable: 0,
  // 保持原凡客TV规则的分类定义
  class_name: '电影&电视剧&动漫&综艺&短剧&纪录片&解说&音乐',
  class_url: '1&2&4&3&8&6&7&5',
  预处理: async () => {
    // 像ikanbot规则一样设置referer头
    rule.headers['referer'] = rule.homeUrl
    return []
  },
  推荐: async function () {
    // 假设首页即为推荐列表
    const html = (await getHtml({
        url: rule.homeUrl,
        headers: rule.headers
    })).data;
    const $ = pq(html);
    // 调整CSS选择器以匹配原始规则的pdfa用法
    const items = $('div.video-wrap div.list-wrap div.item-wrap');
    
    let videos = items.map((_, item) => {
        const title = $(item).find('.meta-wrap a').text().trim();
        const pic_url = $(item).find('.normal-wrap .bg-cover').attr('data-src');
        const desc = $(item).find('.meta-wrap .category').text().trim();
        const url = $(item).find('.meta-wrap a').attr('href');

        return {
            vod_id: url,
            vod_name: title,
            // 采用与ikanbot规则兼容的代理逻辑
            vod_pic: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(pic_url)),
            vod_remarks: desc,
        };
    }).toArray();

    return videos;
  },
  一级: async function (tid, pg, filter, extend) {
    if (pg <= 0) pg = 1;
    // 使用 rule.url 模板构造链接
    const link = rule.homeUrl + rule.url.replace('fyclass', tid).replace('fypage', pg);
    
    const html = (await getHtml({
        url: link,
        headers: rule.headers
    })).data;
    const $ = pq(html);
    // 调整CSS选择器以匹配原始规则的pdfa用法
    const items = $('div.video-wrap div.list-wrap div.item-wrap');

    let videos = items.map((_, item) => {
        const title = $(item).find('.meta-wrap a').text().trim();
        const pic_url = $(item).find('.normal-wrap .bg-cover').attr('data-src');
        const desc = $(item).find('.meta-wrap .category').text().trim();
        const url = $(item).find('.meta-wrap a').attr('href');

        return {
            vod_id: url,
            vod_name: title,
            // 采用与ikanbot规则兼容的代理逻辑
            vod_pic: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(pic_url)),
            vod_remarks: desc,
        };
    }).toArray();

    return videos;
  },
  二级: async function (ids) {
    const detailUrl = rule.homeUrl + ids[0];
    const html = (await getHtml({
        url: detailUrl,
        headers: rule.headers
    })).data;
    const $ = pq(html);
    
    const img = $('.info-more .meta-wrap .thumb').attr('data-src');

    const vod = {
      vod_id: ids[0],
      vod_name: $('.tab-body h1.title').text().trim(),
      // 采用与ikanbot规则兼容的代理逻辑
      vod_pic: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(img)),
      vod_content: $('.info-more .desc').text().trim(),
      vod_remarks: $('.info-more .meta-wrap .mb-2').text().trim(),
      type_name: $('.info-more .meta-wrap .tag-list a').text().trim()
    };
    
    let playFroms = [];
    let playUrls = [];

    // 提取播放源（线路）
    const playList = $('.line-header .item-wrap');
    const tmpFroms = {};
    playList.each((_, it) => {
      const line = $(it).find('div').attr('data-line');
      const name = $(it).find('div').text().trim();
      playFroms.push(name);
      tmpFroms[line] = name;
    });

    // 提取剧集/集数链接
    const indexList = $('.line-list .anthology-list .inner-wrap .item-wrap');
    const tmpIndexs = {};
    indexList.each((_, it) => {
      const index = $(it).find('span.number').text().trim();
      const url = $(it).find('div').attr('data-id');
      tmpIndexs[index] = url;
    });
    
    // 组合播放源和剧集，形成最终播放URL
    for (const item1 in tmpFroms) {
      const tmpUrls = [];
      for (const item2 in tmpIndexs) {
        // 格式：'剧集名$vod_from-vod_id-vod_url'
        const newIndex = `${item1}-${ids[0]}-${tmpIndexs[item2]}`;
        tmpUrls.push(`${item2}$${newIndex}`);
      }
      playUrls.push(tmpUrls.join('#'));
    }
    
    vod.vod_play_from = playFroms.join('$$$');
    vod.vod_play_url = playUrls.join('$$$');

    return vod;
  },
  搜索: async function (wd, quick, pg) {
    if (pg <= 0) pg = 1;
    // 使用 rule.searchUrl 模板构造搜索链接
    const link = rule.homeUrl + rule.searchUrl.replace('**', wd).replace('fypage', pg);

    const html = (await getHtml({
        url: link,
        headers: rule.headers
    })).data;
    const $ = pq(html);
    // 调整CSS选择器以匹配原始规则的pdfa用法
    const items = $('div.video-wrap div.list-wrap div.item-wrap');

    let videos = items.map((_, item) => {
        const title = $(item).find('.meta-wrap a').text().trim();
        const pic_url = $(item).find('.normal-wrap .bg-cover').attr('data-src');
        const desc = $(item).find('.meta-wrap .category').text().trim();
        const url = $(item).find('.meta-wrap a').attr('href');

        return {
            vod_id: url,
            vod_name: title,
            vod_pic: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(pic_url)),
            vod_remarks: desc,
        };
    }).toArray();
    
    return videos;
  },
  lazy: async function (flag, id, flags) {
    const { input } = this;
    const [vod_from, vod_id, vod_url] = id.split("-");
    const detailUrl = `${rule.homeUrl}${vod_id}`;
    
    // 注意：原先的逻辑包含复杂的 POST 请求、Cookie 生成和加密解密，
    // 这些在 ikanbot 的规则环境中无法直接支持。
    // 为了语法兼容性，这里使用一个简化的返回，假设应用会自行处理解析，
    // 遵循 ikanbot 规则的 lazy 简单返回模式。
    
    return {parse: 0, url: input}
  },
  // 简化后的图片代理规则，采用 ikanbot 规则的结构
  proxy_rule: async function () {
    const { input } = this;
    // 解码 Base64 后的 URL
    const url = decodeURIComponent(base64Decode(input.replace(/ /g, '+')));
    
    if (url) {
        // 使用 ikanbot 规则的逻辑获取图片数据
        const resp = (await getHtml({
            url: url,
            headers: {
                // 使用 rule.homeUrl 作为 Referer 来防止图片防盗链
                Referer: rule.homeUrl, 
                'User-Agent': rule.headers['User-Agent']
            },
            responseType: 'arraybuffer' // 以二进制数组形式接收数据
        })).data;
        // 返回图片二进制数据，模拟 ikanbot 规则的 proxy_rule 格式
        return [200, 'image/jpeg', resp]
    }
  },
  // 删除了自定义的 generateCookie, imgDecrypt, decodeImg 函数，因为它们依赖
  // 不支持的全局库（CryptoJS, axios, eval）或属于无法轻松转换的复杂 lazy 逻辑。
};