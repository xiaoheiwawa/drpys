var rule = {
    title: '可可影视',
    host: 'https://www.keke1.app/',
    url: '/show/fyclass-----1-fypage.html',
    searchUrl: '/search?k=**&page=fypage', // 修正搜索占位符
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': PC_UA,
    },
    timeout: 5000,
    class_name: '电影&连续剧&动漫&综艺&短剧',
    class_url: '1&2&3&4&6',
    play_parse: true,
    lazy: '',
    
    // 图片替换：解决防盗链
    图片替换: function (input) {
        let { HOST } = this;
        // 优先替换相对路径的封面图
        if (input.startsWith('/vod1/vod/cover')) {
            return input.replace('/vod1/vod/cover', 'https://vres.cfaqcgj.com/vod1/vod/cover');
        }
        // 其他情况返回原值
        return input;
    },

    // 一级页面（列表页）解析
    一级: '.module-v-box&&.module-item;' +
          '.v-item-footer&&.v-item-title&&Text;' +
          '.lazyload&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    // 二级页面（详情页）解析
    二级: async function (url) {
        let html = await req(url);
        let $ = HTML.parseHTML(html);
        let vod = {
            vod_id: url.match(/\/detail\/(\d+)\.html/)?.[1] || '',
            vod_name: $('h1.title').text().trim() || $('.v-detail-title').text().trim(),
            vod_pic: $('.v-lazy').attr('data-original'),
            type_name: $('.tag-link').text().trim(),
            vod_year: $('span:contains("年份")').next().text().trim(),
            vod_area: $('span:contains("地区")').next().text().trim(),
            vod_remarks: $('.v-item-bottom span').text().trim(), // 如“已完结”、“更新至12集”
            vod_actor: $('span:contains("主演")').next().text().trim(),
            vod_director: $('span:contains("导演")').next().text().trim(),
            vod_content: $('span:contains("简介")').next().text().trim().replace(/\s+/g, ' '),
        };

        // 解析播放源（多线路支持）
        let playMap = {};
        $('.module-play-list').each((index, element) => {
            let $list = $(element);
            let from = $list.find('.module-tab-item.active').text().trim() || `线路${index + 1}`;
            let episodes = [];
            $list.find('a').each((i, a) => {
                let $a = $(a);
                let title = $a.text().trim();
                let href = $a.attr('href');
                if (href) {
                    episodes.push(title + '$' + href);
                }
            });
            if (episodes.length > 0) {
                playMap[from] = episodes.join('#');
            }
        });

        // 设置播放源字段
        vod.vod_play_from = Object.keys(playMap).join('$$$');
        vod.vod_play_url = Object.values(playMap).join('$$$');

        return {
            list: [vod]
        };
    },

    // 搜索结果解析（与一级相同）
    搜索: '.module-item;' +
          '.v-item-footer&&.v-item-title&&Text;' +
          '.lazyload&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',
};