var rule = {
    类型: '影视',
    title: '可可',
    host: 'https://www.keke1.app/', // 主站，已去除空格
    // host: 'https://www.keke8.app/', // 可选备用站
    // host: 'https://www.kkys01.com/', // 可选备用站

    url: '/show/fyclass-----1-fypage.html', // 一级列表页
    searchUrl: '/search?k=**&page=fypage', // 搜索页，已修正参数
    searchable: 1, // 原规则为0，但网站支持搜索，建议开启
    quickSearch: 0,
    filterable: 0, // 当前规则未实现筛选，可设为0
    headers: {
        'User-Agent': PC_UA,
    },
    timeout: 5000,
    class_name: '电影&连续剧&动漫&综艺&短剧',
    class_url: '1&2&3&4&6',
    play_parse: true,

    // 分类解析：由于页面是静态加载，可直接用选择器
    class_parse: '.nav-bar&&a;a&&Text;a&&href;/show/(\\d+).html',

    // 预处理：可以留空，或用于初始化
    预处理: $js.toString(() => {
        // 可以在这里进行一些初始化操作
        log('可可影视规则已加载');
    }),

    // 图片替换：核心功能，修复图片加载问题
    图片替换: function (input) {
        // 将所有指向本站的图片路径，替换为已知的CDN
        // 注意：HOST 是当前 host 的值，即 https://www.keke1.app
        // 这里将 /vod/ 或 /static/ 等路径替换为真实CDN
        return input
            .replace(/https?:\/\/[^\/]+\/vod\//g, 'https://vres.cfaqcgj.com/vod/')
            .replace(/https?:\/\/[^\/]+\/static\//g, 'https://vres.cfaqcgj.com/static/')
            .replace(/\/vod\//g, 'https://vres.cfaqcgj.com/vod/')
            .replace(/\/static\//g, 'https://vres.cfaqcgj.com/static/');
    },

    // 推荐：从首页提取推荐内容
    推荐: async function (tid, pg, filter, extend) {
        let html = await this.request(this.host);
        let $ = html.html();
        let d = [];

        // 分析页面，提取推荐区块，例如 class 为 module-v-box 的容器
        $('.module-v-box .module-item').each((index, el) => {
            let $item = $(el);
            d.push({
                title: $item.find('.v-item-title:eq(1)').text().trim(),
                img: $item.find('.lazyload:eq(-1)').attr('data-original'),
                desc: $item.find('.v-item-bottom').text().trim(),
                url: $item.find('a').attr('href')
            });
        });

        return { list: d };
    },

    // 一级列表解析
    一级: '.module-v-box&&.module-item;' +
          '.v-item-title:eq(1)&&Text;' +
          '.lazyload:eq(-1)&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    // 二级详情页解析
    二级: async function (ids) {
        let { input: url } = this;
        let html = await this.request(url);
        let $ = html.html();
        let vod = {};

        // 提取基本信息
        vod.vod_name = $('.detail-title h1').text().trim(); // 片名
        vod.vod_pic = $('.detail-pic img').attr('data-original'); // 封面图
        // 简介在 .detail-desc 内，包含HTML标签，可以保留
        vod.vod_content = $('.detail-desc').html() || $('.detail-desc').text().trim();

        // 播放线路和集数
        let episodes = {};
        $('.module-play-list').each((index, el) => {
            let $list = $(el);
            let flag = $list.prev('.module-tab-items').find('.module-tab-item.current').text().trim() || 
                       $list.siblings('.module-header').find('h4').text().trim() || 
                       `线路${index + 1}`; // 线路名称

            let urls = [];
            $list.find('a').each((i, a) => {
                let $a = $(a);
                let title = $a.text().trim();
                let href = $a.attr('href');
                if (href) {
                    // 确保链接是绝对路径
                    if (!href.startsWith('http')) {
                        href = this.host + href;
                    }
                    urls.push(`${title}$${href}`);
                }
            });
            if (urls.length > 0) {
                episodes[flag] = urls;
            }
        });

        // 拼接成TVBox标准格式
        if (Object.keys(episodes).length > 0) {
            vod.vod_play_from = Object.keys(episodes).join('$$$');
            vod.vod_play_url = Object.values(episodes).map(list => list.join('#')).join('$$$');
        }

        return vod;
    },

    // 搜索结果解析
    搜索: '.module-search-item;a&&Text;img&&data-original;.video-remarks&&Text;a&&href;.video-info-header&&Text',

    // 播放解析：模拟点击以触发真实播放地址
    lazy: $js.toString(() => {
        input = {
            parse: 1,
            url: input,
            js: `
                // 等待视频元素出现并模拟点击
                let video = document.querySelector('video');
                if (video) {
                    video.click();
                    // 有些页面需要触发播放
                    if (typeof video.play === 'function') {
                        video.play().catch(() => {});
                    }
                }
                // 或者点击播放按钮
                let btn = document.querySelector('.btn-play, .play-btn');
                if (btn) btn.click();
            `
        };
    },
};