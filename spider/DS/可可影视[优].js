var rule = {
    类型: '影视',
    title: '可可影视',
    host: 'https://www.keke8.app/',
    // 备用域名（若主站失效）
    // host: 'https://www.kkys01.com/',

    homeUrl: '/',
    url: '/show/fyclass-fyfilter-fypage.html',
    filter_url: '{{fl.类型}}-{{fl.地区}}-{{fl.语言}}-{{fl.年份}}-{{fl.排序}}',
    searchUrl: '/search?k=**&page=fypage',
    searchable: 2,     // 支持搜索
    quickSearch: 0,    // 不支持快捷搜索
    filterable: 1,     // 支持高级筛选
    headers: {
        'User-Agent': MOBILE_UA,
    },

    // 分类解析：导航栏中的分类
    class_parse: '#nav-swiper&&.nav-swiper-slide;a&&Text;a&&href;/show/(\\d+).html',
    cate_exclude: 'Netflix|今日更新|专题列表|排行榜|APP', // 排除无关分类
    tab_exclude: '可可影视提供|温馨提示', // 播放页排除无效线路
    tab_order: ['超清', '蓝光9', '极速蓝光'], // 优先显示的播放线路
    tab_remove: ['4K(高峰不卡)', 'FF线路'], // 移除卡顿或无效线路

    play_parse: true,
    lazy: $js.toString(() => {
        input = {
            parse: 1,
            url: input,
            js: 'document.querySelector("#my-video video")?.click();' // 模拟点击播放，触发真实地址加载
        };
    }),
    limit: 20, // 每页数量

    // 推荐位：首页第3个 section-box（即“热门推荐”或“最新上线”）
    推荐: async function (tid, pg, filter, extend) {
        let html = await this.request(this.host + this.homeUrl);
        let $ = html.html();
        let $box = $('.section-box').eq(2); // 第3个区块
        if (!$box.length) return { list: [] };

        let items = $box.find('.module-item');
        let d = [];

        items.each((index, el) => {
            let $item = $(el);
            d.push({
                title: $item.find('.v-item-footer .v-item-title:eq(1)').text().trim(),
                img: $item.find('img[data-original]:not([src*="logo_placeholder"])').attr('data-original'),
                desc: $item.find('.v-item-bottom').text().trim(),
                url: $item.find('a').attr('href')
            });
        });

        return { list: d };
    },

    // 一级列表：电影/电视剧/动漫 列表页
    一级: '.module-box-inner&&.module-item;' +
          '.v-item-footer .v-item-title:eq(1)&&Text;' +
          'img[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    // 二级详情页
    二级: {
        title: '.detail-pic&&img&&alt', // 影片名称
        img: '.detail-pic&&img&&data-original', // 封面图
        desc: '.detail-info-row-main:eq(-2)&&Text||' +      // 豆瓣评分
              '.detail-tags&&a:eq(0)&&Text||' +             // 类型
              '.detail-tags&&a:eq(1)&&Text||' +             // 地区
              '.detail-info-row-main:eq(1)&&Text||' +       // 年份
              '.detail-info-row-main:eq(2)&&Text',          // 更新状态
        content: '.detail-desc&&Text',                      // 简介
        tabs: '.source-item-label',                         // 播放线路标签
        lists: '.episode-list:eq(#id) a',                   // 集数列表
    },

    // 搜索结果
    搜索: '.search-result-list&&a;' +
          '.title:eq(1)&&Text;' +
          '*;' +
          '.search-result-item-header&&Text;' +
          'a&&href;' +
          '.desc&&Text',

    // 预处理：动态获取图片CDN地址（解决图片无法加载）
    预处理: $js.toString(() => {
        try {
            let html = request(rule.host);
            let scripts = pdfa(html, 'script');
            let rdulScript = scripts.find(it => pdfh(it, 'script&&src').includes('rdul.js'));
            if (rdulScript) {
                let scriptUrl = pdfh(rdulScript, 'script&&src');
                let scriptContent = request(scriptUrl);
                let cdnMatch = scriptContent.match(/'(https?:\/\/[^']+)'/);
                if (cdnMatch && cdnMatch[1]) {
                    let imgHost = cdnMatch[1].replace(/\/$/, '');
                    log(`✅ 成功获取图片CDN: ${imgHost}`);
                    rule.图片替换 = '/vod1/vod/=>' + imgHost + '/vod1/vod/';
                }
            }
        } catch (e) {
            log(`⚠️ 预处理失败: ${e.message}`);
            rule.图片替换 = '/vod1/vod/=>https://vres.cfaqcgj.com/vod1/vod/';
        }
    }),

    // 图片替换（由 预处理 动态设置）
    // 图片替换: '/vod1/vod/=>https://vres.cfaqcgj.com/vod1/vod/',

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
        "2": "同1", // 电视剧（可复制）
        "3": "同1", // 动漫
        "4": "同1", // 综艺
        "6": "同1"  // 短剧
    }
};