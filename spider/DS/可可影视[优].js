var rule = {
	类型:'影视',
    title: '可可影视',
    host: 'https://www.keke8.app/',
    // 推荐备用域名（若主站失效）
    // host: 'https://www.kkys01.com/',
    homeUrl: '/',
    url: '/show/fyclass-fyfilter-fypage.html',
    filter_url: '{{fl.类型}}-{{fl.地区}}-{{fl.语言}}-{{fl.年份}}-{{fl.排序}}',
    searchUrl: '/search?k=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {
        'User-Agent': MOBILE_UA,
    },

    // 分类解析
    class_parse: '#nav-swiper&&.nav-swiper-slide;a&&Text;a&&href;/show/(\\d+).html',
    cate_exclude: 'Netflix|今日更新|专题列表|排行榜|APP',
    tab_exclude: '可可影视提供|温馨提示',
    tab_order: ['超清', '蓝光9', '极速蓝光'],
    tab_remove: ['4K(高峰不卡)', 'FF线路'],

    play_parse: true,
    lazy: $js.toString(() => {
        input = {
            parse: 1,
            url: input,
            js: 'document.querySelector("#my-video video")?.click();'
        };
    }),
    limit: 20,

    // 推荐位：取首页第2个 section-box
    推荐: async function (tid, pg, filter, extend) {
    // 如果有缓存或首页已加载，可直接复用 rule.一级 的逻辑
    let homeFn = rule.一级.bind(this);
    
    // 请求首页
    let html = await this.request(rule.host + rule.homeUrl);

    // 提取推荐区域：第3个 .section-box（索引为2），包含推荐内容
    let $ = html.html();
    let $box = $('.section-box').eq(2); // 第3个 section-box

    if (!$box.length) {
        return { list: [] };
    }

    // 将选中的推荐区块包装成新的 HTML，供 rule.一级 解析
    let innerHtml = $box.find('.module-box-inner').html();
    if (!innerHtml) {
        return { list: [] };
    }

    // 构造模拟的 HTML 响应，只包含推荐内容
    let fakeHtml = `<div class="module-box-inner">${innerHtml}</div>`;
    
    // 复用 '一级' 的解析逻辑来解析推荐项
    return await homeFn(fakeHtml);
},

    // 一级列表解析（修复标题、图片选择器）
    一级: '.module-box-inner&&.module-item;' +
          '.v-item-footer .v-item-title:eq(1)&&Text;' +
          'img[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    // 二级详情页解析
    二级: {
        title: '.detail-pic&&img&&alt', // 影片名称
        img: '.detail-pic&&img&&data-original', // 封面图
        desc: '.detail-info-row-main:eq(-2)&&Text||' + // 豆瓣评分
              '.detail-tags&&a:eq(0)&&Text||' + // 类型
              '.detail-tags&&a:eq(1)&&Text||' + // 地区
              '.detail-info-row-main:eq(1)&&Text||' + // 年份
              '.detail-info-row-main:eq(2)&&Text', // 更新状态
        content: '.detail-desc&&Text', // 简介
        tabs: '.source-item-label', // 播放线路标签
        lists: '.episode-list:eq(#id) a', // 集数列表
    },

    // 搜索结果解析
    搜索: '.search-result-list&&a;' +
          '.title:eq(1)&&Text;' +
          '*;' +
          '.search-result-item-header&&Text;' +
          'a&&href;' +
          '.desc&&Text',

    // 预处理：动态获取图片CDN地址
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
                    let imgHost = cdnMatch[1];
                    log(`✅ 成功获取图片CDN: ${imgHost}`);
                    rule.图片替换 = rule.host + '=>' + imgHost;
                }
            }
        } catch (e) {
            log(`⚠️ 预处理失败: ${e.message}`);
            // 备用 CDN
            rule.图片替换 = '/vod1/vod/=>' + 'https://vres.cfaqcgj.com/vod1/vod/';
        }
    }),

    // 图片替换（由 预处理 动态设置，也可手动指定）
    // 图片替换: '/vod1/vod/=>https://vres.cfaqcgj.com/vod1/vod/',

    // 过滤器（已解码）
    filter: {
        "1": [
            {"key":"类型","name":"类型","value":[
                {"n":"全部","v":""},
                {"n":"动作","v":"1"},
                {"n":"喜剧","v":"2"},
                {"n":"爱情","v":"3"},
                {"n":"科幻","v":"4"},
                {"n":"恐怖","v":"5"},
                {"n":"剧情","v":"6"},
                {"n":"战争","v":"7"},
                {"n":"纪录片","v":"8"}
            ]},
            {"key":"地区","name":"地区","value":[
                {"n":"全部","v":""},
                {"n":"大陆","v":"大陆"},
                {"n":"香港","v":"香港"},
                {"n":"台湾","v":"台湾"},
                {"n":"美国","v":"美国"},
                {"n":"韩国","v":"韩国"},
                {"n":"日本","v":"日本"},
                {"n":"法国","v":"法国"},
                {"n":"英国","v":"英国"},
                {"n":"其他","v":"其他"}
            ]},
            {"key":"语言","name":"语言","value":[
                {"n":"全部","v":""},
                {"n":"国语","v":"国语"},
                {"n":"英语","v":"英语"},
                {"n":"粤语","v":"粤语"},
                {"n":"闽南语","v":"闽南语"},
                {"n":"韩语","v":"韩语"},
                {"n":"日语","v":"日语"}
            ]},
            {"key":"年份","name":"年份","value":[
                {"n":"全部","v":""},
                {"n":"2025","v":"2025"},
                {"n":"2024","v":"2024"},
                {"n":"2023","v":"2023"},
                {"n":"2022","v":"2022"},
                {"n":"2021","v":"2021"},
                {"n":"2020","v":"2020"},
                {"n":"更早","v":"更早"}
            ]},
            {"key":"排序","name":"排序","value":[
                {"n":"全部","v":""},
                {"n":"按时间","v":"3"},
                {"n":"按人气","v":"2"},
                {"n":"按评分","v":"4"}
            ]}
        ],
        "2": [{"key":"类型","name":"类型","value":[...]}, /* 同上，电视剧分类 */],
        "3": [{"key":"类型","name":"类型","value":[...]}, /* 动漫 */],
        "4": [{"key":"类型","name":"类型","value":[...]}, /* 综艺 */],
        "6": [{"key":"类型","name":"类型","value":[...]}, /* 短剧 */]
    }
};