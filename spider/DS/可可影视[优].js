var rule = {
    类型: '影视',
    title: '可可影视',
    host: 'https://www.keke8.app/', // 主站（已去空格）
    // host: 'https://www.kkys01.com/', // 备用站（已去空格，可随时切换）

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

    // 推荐位：取首页第3个 section-box
    推荐: async function (tid, pg, filter, extend) {
        try {
            let url = this.host + this.homeUrl;
            let html = await this.request(url);
            let $ = html.html();
            let $box = $('.section-box').eq(2);
            if (!$box.length) return { list: [] };

            let d = [];
            $box.find('.module-item').each((index, el) => {
                let $el = $(el);
                d.push({
                    title: $el.find('.v-item-footer .v-item-title:eq(1)').text().trim(),
                    img: $el.find('img[data-original]:not([src*="logo_placeholder"])').attr('data-original'),
                    desc: $el.find('.v-item-bottom').text().trim(),
                    url: $el.find('a').attr('href')
                });
            });
            return { list: d };
        } catch (e) {
            console.log('推荐位加载失败:', e.message);
            return { list: [] };
        }
    },

    // 一级列表解析
    一级: '.module-box-inner&&.module-item;' +
          '.v-item-footer .v-item-title:eq(1)&&Text;' +
          'img[data-original]:not([src*="logo_placeholder"])&&data-original;' +
          '.v-item-bottom&&Text;' +
          'a&&href',

    // 二级详情页解析
    二级: {
        title: '.detail-pic&&img&&alt',
        img: '.detail-pic&&img&&data-original',
        desc: '.detail-info-row-main:eq(-2)&&Text||' +
              '.detail-tags&&a:eq(0)&&Text||' +
              '.detail-tags&&a:eq(1)&&Text||' +
              '.detail-info-row-main:eq(1)&&Text||' +
              '.detail-info-row-main:eq(2)&&Text',
        content: '.detail-desc&&Text',
        tabs: '.source-item-label',
        lists: '.episode-list:eq(#id) a',
    },

    // 搜索结果解析
    搜索: '.search-result-list&&a;' +
          '.title:eq(1)&&Text;' +
          '*;' +
          '.search-result-item-header&&Text;' +
          'a&&href;' +
          '.desc&&Text',

    // 预处理：动态获取图片CDN地址（已优化）
    预处理: $js.toString(() => {
        try {
            // 1. 请求主页
            let html = request(rule.host);
            let $ = html.html();

            // 2. 尝试从页面加载的JS中找CDN
            let scripts = pdfa(html, 'script');
            let targetScript = scripts.find(it => {
                let src = pdfh(it, 'script&&src');
                return src && (src.includes('rdul.js') || src.includes('common.js') || src.includes('.js'));
            });

            if (targetScript) {
                let scriptUrl = pdfh(targetScript, 'script&&src');
                // 如果是相对路径，补全
                if (scriptUrl.startsWith('/')) scriptUrl = rule.host + scriptUrl;
                let scriptContent = request(scriptUrl);

                // 3. 使用更宽泛的正则匹配任何可能的CDN，优先包含 /vod1/vod/ 路径的
                let cdnMatch = scriptContent.match(/https?:\/\/[^\s'"]*\/vod1\/vod\/[^\s'"]*/);
                if (cdnMatch) {
                    // 提取出根域名
                    let cdnUrl = cdnMatch[0];
                    let cdnHost = cdnUrl.match(/(https?:\/\/[^\/]+)/);
                    if (cdnHost && cdnHost[1]) {
                        log(`✅ 成功从JS提取图片CDN根地址: ${cdnHost[1]}`);
                        rule.图片替换 = '/vod1/vod/=>' + cdnHost[1] + '/vod1/vod/';
                        return; // 成功则返回
                    }
                }
            }

            // 4. 如果JS中找不到，尝试从页面图片链接直接提取
            let imgSrc = pdfh(html, 'img[data-original]&&data-original');
            if (imgSrc && imgSrc.includes('/vod1/vod/')) {
                let imgHost = imgSrc.match(/(https?:\/\/[^\/]+)/);
                if (imgHost && imgHost[1]) {
                    log(`✅ 成功从页面图片提取CDN: ${imgHost[1]}`);
                    rule.图片替换 = '/vod1/vod/=>' + imgHost[1] + '/vod1/vod/';
                    return;
                }
            }

        } catch (e) {
            log(`⚠️ 预处理阶段1失败: ${e.message}`);
        }

        // 5. 所有方法失败，使用一个更通用的回退策略
        log(`⚠️ 所有CDN提取方法失败，使用最终备用方案`);
        // 这是一个示例，您可能需要根据实际情况更改
        // rule.图片替换 = '/vod1/vod/=>https://your-backup-cdn.com/vod1/vod/';
        // 当前设置为不替换，让系统直接请求相对路径（依赖host）
        // rule.图片替换 = '';
        // 或者，您可以尝试一个公共的、可能有效的CDN（风险：可能也失效）
        rule.图片替换 = '/vod1/vod/=>https://cdn.example.com/vod1/vod/'; // 请替换为真实有效的地址
    }),

    // 图片替换（由 预处理 动态设置）
    // 图片替换: '',

    // 过滤器（已补全所有分类）
    filter: (() => {
        // 定义通用的筛选项
        const common = {
            类型: [
                {"n":"全部","v":""},{"n":"动作","v":"1"},{"n":"喜剧","v":"2"},{"n":"爱情","v":"3"},
                {"n":"科幻","v":"4"},{"n":"恐怖","v":"5"},{"n":"剧情","v":"6"},{"n":"战争","v":"7"},{"n":"纪录片","v":"8"}
            ],
            地区: [
                {"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},
                {"n":"美国","v":"美国"},{"n":"韩国","v":"韩国"},{"n":"日本","v":"日本"},{"n":"法国","v":"法国"},{"n":"英国","v":"英国"},{"n":"其他","v":"其他"}
            ],
            语言: [
                {"n":"全部","v":""},{"n":"国语","v":"国语"},{"n":"英语","v":"英语"},{"n":"粤语","v":"粤语"},
                {"n":"闽南语","v":"闽南语"},{"n":"韩语","v":"韩语"},{"n":"日语","v":"日语"}
            ],
            年份: [
                {"n":"全部","v":""},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},
                {"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"更早","v":"更早"}
            ],
            排序: [
                {"n":"全部","v":""},{"n":"按时间","v":"3"},{"n":"按人气","v":"2"},{"n":"按评分","v":"4"}
            ]
        };

        return {
            "1": Object.keys(common).map(key => ({ key, name: key, value: common[key] })),
            "2": Object.keys(common).map(key => ({ key, name: key, value: common[key] })),
            "3": Object.keys(common).map(key => ({ key, name: key, value: common[key] })),
            "4": Object.keys(common).map(key => ({ key, name: key, value: common[key] })),
            "6": Object.keys(common).map(key => ({ key, name: key, value: common[key] }))
        };
    })()
};