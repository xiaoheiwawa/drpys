var rule = {
    title: '可可影视',
    host: 'https://www.keke1.app/', // 使用活跃域名
    homeUrl: '/',
    url: '/show/fyclass-----1-fypage.html',
    searchUrl: '/search?k=**&page=fypage',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: {
         'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 Edg/139.0.0.0',
    },

    图片替换: function (input) {
        if (typeof input !== 'string') return input;
        return input.replace('/vod1/vod/', 'https://vres.cfaqcgj.com/vod1/vod/');
    },

    一级: '.module-item;' +
          '.v-item-footer&&.v-item-title&&Text;' +
          '.lazyload[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    二级: async function (url) {
        let html = await req(url, {
            headers: this.headers
        });
        let $ = HTML.parseHTML(html);
        let vod = {
            vod_id: url.match(/\/detail\/(\d+)\.html/)?.[1] || '',
            vod_name: $('h1.title').text().trim() || $('.v-detail-title').text().trim(),
            vod_pic: $('.v-lazy').attr('data-original'),
            vod_remarks: $('.v-item-bottom span').text().trim(),
            vod_content: $('span:contains("简介")').next().text().trim(),
            vod_actor: $('span:contains("主演")').next().text().trim(),
            vod_director: $('span:contains("导演")').next().text().trim(),
            vod_year: $('span:contains("年份")').next().text().trim(),
            vod_area: $('span:contains("地区")').next().text().trim(),
        };

        let episodes = [];
        $('.module-play-list a').each((i, a) => {
            let $a = $(a);
            episodes.push($a.text().trim() + '$' + $a.attr('href'));
        });

        vod.vod_play_from = '可可影视';
        vod.vod_play_url = episodes.join('#');

        return { list: [vod] };
    },

    搜索: '.module-item;' +
          '.v-item-footer&&.v-item-title&&Text;' +
          '.lazyload[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href'
};