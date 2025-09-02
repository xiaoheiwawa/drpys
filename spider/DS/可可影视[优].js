var rule = {
    title: '可可影视',
    host: 'https://www.kekys.com/', // ✅ 使用当前活跃域名
    homeUrl: '/',
    url: '/show/fyclass-----1-fypage.html',
    searchUrl: '/search?k=**&page=fypage',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    },

    // 图片替换：修复路径 + 去除多余空格
    图片替换: function (input) {
        if (typeof input !== 'string') return input;
        // 修复：原替换目标多了空格，且应优先匹配完整路径
        return input
            .replace('/vod1/vod/cover/', 'https://vres.cfaqcgj.com/vod1/vod/cover/')
            .replace('/vod1/vod/upload/', 'https://vres.cfaqcgj.com/vod1/vod/upload/');
    },

    // 一级列表解析（已验证）
    一级: '.module-item;' +
          '.v-item-footer .v-item-title:eq(1)&&Text;' + // 第二个 .v-item-title 是真实标题
          '.lazyload[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    // 二级详情页解析（修正容错）
    二级: async function (url) {
        let html = await req(url, { headers: this.headers });
        let $ = HTML.parseHTML(html);

        let vod = {
            vod_id: url.match(/\/detail\/(\d+)\.html/)?.[1] || '',
            // 标题可能在 .v-detail-title 或从 h1 获取
            vod_name: $('.v-detail-title').text().trim() || $('h1').text().trim(),
            // 图片：优先取 data-original
            vod_pic: $('.v-lazy[data-original]').attr('data-original') || '',
            // 备注：更新状态
            vod_remarks: $('.v-item-bottom span').text().trim(),
            // 简介
            vod_content: $('span:contains("简介")').next().text().trim().replace(/\s+/g, ' '),
            // 主演
            vod_actor: (() => {
                let actor = $('span:contains("主演")').next().text().trim();
                return actor || '未知';
            })(),
            // 导演
            vod_director: (() => {
                let director = $('span:contains("导演")').next().text().trim();
                return director || '未知';
            })(),
            // 年份
            vod_year: $('span:contains("年份")').next().text().trim(),
            // 地区
            vod_area: $('span:contains("地区")').next().text().trim(),
        };

        // 播放列表解析（多线路支持）
        let playMap = {};
        $('.module-play-list').each((index, list) => {
            let $list = $(list);
            // 线路名称（如“量子线路”）
            let from = $list.find('.module-tab-item.active').text().trim() || `线路${index + 1}`;
            let episodes = [];
            $list.find('a[href^="/play/"]').each((i, a) => {
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

        // 兼容 TVBox 多播放源格式
        vod.vod_play_from = Object.keys(playMap).join('$$$');
        vod.vod_play_url = Object.values(playMap).join('$$$');

        return { list: [vod] };
    },

    // 搜索结果解析（与一级相同）
    搜索: '.module-item;' +
          '.v-item-footer .v-item-title:eq(1)&&Text;' +
          '.lazyload[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href'
};