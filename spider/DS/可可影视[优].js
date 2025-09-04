var rule = {
    类型: '影视',
    title: '可可',
    // 主站和备用站，已去除尾部空格
    host: 'https://www.keke8.app/',
    // host: 'https://www.kkys01.com/',
    // host: 'https://www.keke1.app/',

    homeUrl: '/',
    // 一级列表页的URL格式
    url: '/show/fyclass-fyfilter-fypage.html',
    // 筛选参数的模板
    filter_url: '{{fl.类型}}-{{fl.地区}}-{{fl.语言}}-{{fl.年份}}-{{fl.排序}}',
    // 搜索页URL
    searchUrl: '/search?k=**&page=fypage',
    // 支持搜索、筛选
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    // 使用PC UA
    headers: {
        'User-Agent': PC_UA,
    },
    // 每页数量
    limit: 20,

    // 分类解析：从导航栏提取
    class_parse: '#nav-bar&&.nav-swiper-slide;a&&Text;a&&href;/channel/(\\d+).html',
    // 过滤掉无关的分类
    cate_exclude: '专题列表|排行榜|APP|Netflix|今日更新',
    // 播放页过滤掉提示类线路
    tab_exclude: '温馨提示|可可影视提供',
    // 优先显示的线路
    tab_order: ['超清', '蓝光9', '极速蓝光'],
    // 移除已知卡顿的线路
    tab_remove: ['4K(高峰不卡)', 'FF线路'],

    // 启用播放解析
    play_parse: true,
    // 播放时模拟点击视频，触发真实地址加载
    lazy: $js.toString(() => {
        input = {
            parse: 1,
            url: input,
            js: 'document.querySelector("#my-video video")?.click();'
        };
    }),

    // 预处理：由于CDN已知，此部分可简化或用于日志
    预处理: $js.toString(() => {
        log('可可影视规则加载成功');
        // 无需动态获取CDN，直接在 图片替换 中设置
    }),

    // 图片替换：根据HTML源码，核心CDN为 vf.cfaqcgj.com
    // 这是解决图片加载问题的关键！
    图片替换: '/vod1/vod/=>https://vf.cfaqcgj.com/vod1/vod/;/vod_pc_static_kkdy/=>https://vf.cfaqcgj.com/vod_pc_static_kkdy/',

    // 推荐：从首页提取第一个推荐区块（通常是轮播图下方的第一个 .section-box）
    推荐: async function (tid, pg, filter, extend) {
        try {
            let url = this.host + this.homeUrl;
            let html = await this.request(url);
            let $ = html.html();
            let d = [];

            // 提取第一个推荐模块，通常是 .section-box:eq(1) 或根据ID
            // 根据常见布局，跳过轮播图后的第一个 .section-box
            let $firstBox = $('.section-box').eq(1);
            if (!$firstBox.length) return { list: [] };

            $firstBox.find('.module-item').each((index, el) => {
                let $item = $(el);
                d.push({
                    title: $item.find('.v-item-footer .v-item-title:eq(1)').text().trim(),
                    img: $item.find('img[data-original]:not([src*="logo_placeholder"])').attr('data-original'),
                    desc: $item.find('.v-item-bottom').text().trim(),
                    url: $item.find('a').attr('href')
                });
            });
            return { list: d };
        } catch (e) {
            log('推荐位加载失败: ' + e.message);
            return { list: [] };
        }
    },

    // 一级列表解析
    一级: '.module-v-box&&.module-item;' +
          '.v-item-footer .v-item-title:eq(1)&&Text;' +
          'img[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    // 二级详情页解析
    二级: {
        // 影片名称
        title: '.detail-title h1&&Text||.detail-pic img&&alt',
        // 封面图
        img: '.detail-pic img&&data-original',
        // 描述信息：豆瓣评分、类型、地区、年份、更新状态
        desc: '.v-item-top-left&&Text||' +               // 豆瓣评分
              '.detail-tags a:eq(0)&&Text||' +           // 类型
              '.detail-tags a:eq(1)&&Text||' +           // 地区
              '.detail-info-row-main:eq(1)&&Text||' +    // 年份
              '.detail-info-row-main:eq(2)&&Text',       // 更新状态
        // 剧情简介
        content: '.detail-desc&&Text',
        // 播放线路标签
        tabs: '.source-item-label',
        // 集数列表，#id 会被替换为线路索引
        lists: '.episode-list:eq(#id) a',
    },

    // 搜索结果解析
    搜索: '.module-search-item;' +
          'a&&Text;' +
          'img&&data-original;' +
          '.video-remarks&&Text;' +
          'a&&href;' +
          '.video-info-header&&Text',

    // 筛选器（电影、电视剧、动漫、综艺、短剧）
    filter: {
        "1": [ // 电影
            {"key":"类型","name":"类型","value":[
                {"n":"全部","v":""},{"n":"动作","v":"1"},{"n":"喜剧","v":"2"},{"n":"爱情","v":"3"},
                {"n":"科幻","v":"4"},{"n":"恐怖","v":"5"},{"n":"剧情","v":"6"},{"n":"战争","v":"7"},{"n":"纪录片","v":"8"}
            ]},
            {"key":"地区","name":"地区","value":[
                {"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},
                {"n":"美国","v":"美国"},{"n":"韩国","v":"韩国"},{"n":"日本","v":"日本"},{"n":"法国","v":"法国"},{"n":"英国","v":"英国"},{"n":"其他","v":"其他"}
            ]},
            {"key":"语言","name":"语言","value":[
                {"n":"全部","v":""},{"n":"国语","v":"国语"},{"n":"英语","v":"英语"},{"n":"粤语","v":"粤语"},
                {"n":"闽南语","v":"闽南语"},{"n":"韩语","v":"韩语"},{"n":"日语","v":"日语"}
            ]},
            {"key":"年份","name":"年份","value":[
                {"n":"全部","v":""},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},
                {"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"更早","v":"更早"}
            ]},
            {"key":"排序","name":"排序","value":[
                {"n":"全部","v":""},{"n":"按时间","v":"3"},{"n":"按人气","v":"2"},{"n":"按评分","v":"4"}
            ]}
        ],
        "2": "同1", // 电视剧
        "3": "同1", // 动漫
        "4": "同1", // 综艺
        "6": "同1"  // 短剧
    }
};