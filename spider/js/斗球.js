/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '斗球[錄像]',
  '类型': '體育',
  lang: 'ds'
})
*/

var rule = {
    title: '斗球[录]',
    host: 'https://www.dooqiu.com',
    homeUrl: '/',
    url: function (params) {
        let { class: cls, page } = params;
        return page === 1 ? `/a/${cls}/` : `/a/${cls}/list_1_${page}.html`;
    },
    detailUrl: '',
    searchUrl: '/search?keyword=**',
    searchable: 2,
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    },
    timeout: 5000,
    
    class_name: 'NBA錄像&CBA錄像&足球錄像',
    class_url: 'nbalx&cbalx&zqlx', 
    
    double: true,
    limit: 20,
    play_parse: true,

    一级: function (s) {
        let list = pdfa(s.data, 'ul.ent li.lite');
        return {
            list: list.map(item => ({
                title: pdfh(item, 'h2 a&&Text').trim(),
                url: pdfh(item, 'h2 a&&href'),
                content: pdfh(item, '.lite_bot .pass_time&&Text').trim()
            }))
        };
    },

    推荐: function (s) {
        let list = pdfa(s.data, '.list.nbalx:first ul.ent li.lite').slice(0, 6);
        return {
            list: list.map(item => ({
                title: pdfh(item, 'h2 a&&Text').trim(),
                url: pdfh(item, 'h2 a&&href'),
                content: pdfh(item, '.lite_bot .pass_time&&Text').trim()
            }))
        };
    },

    二级: {
        title: "h2:eq(0)&&Text",
        desc: "p:eq(0)&&Text",
        content: "p:eq(0)&&Text",
        tabs: function (html) {
            let signals = pdfh(html, 'div.signals&&html') || '';
            if (!signals) return ['视频源'];
            // 清洗 + 提取 h2
            signals = signals.replace(/\s+/g, ' ');
            let h2s = [...signals.matchAll(/<h2[^>]*>([^<]+?)<\/h2>/gi)];
            let tabs = h2s.map(m => m[1].trim()).filter(x => x);
            return tabs.length ? tabs : ['视频源'];
        },
        lists: function (html, tabs) {
            let signals = pdfh(html, 'div.signals&&html') || '';
            if (!signals) return { '视频源': [] };

            // ✅ 关键：标准化分段
            signals = signals.replace(/\s+/g, ' ')
                             .replace(/<\/?[a-z]+>\s*<h2/gi, '<SPLIT><h2')
                             .replace(/<h2/gi, '<SPLIT><h2');

            let blocks = signals.split('<SPLIT>').filter(Boolean);
            let result = {};
            let currentTab = '视频源';

            blocks.forEach(block => {
                let h2m = block.match(/<h2[^>]*>([^<]+?)<\/h2>/i);
                if (h2m) {
                    currentTab = h2m[1].trim() || '其他';
                    if (!result[currentTab]) result[currentTab] = [];
                }

                let links = [...block.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
                links.forEach(m => {
                    let url = m[1];
                    let text = m[2]
                        .replace(/<[^>]+>/g, '') // 去标签
                        .replace(/\s+/g, ' ')
                        .trim();

                    if (url && text && url !== '#' && !url.includes('javascript')) {
                        if (!result[currentTab]) result[currentTab] = [];
                        result[currentTab].push(text + '$' + url);
                    }
                });
            });

            return result;
        }
    },

    lazy: function (input) {
        let url = input;
        if (/v\.qq\.com|weibo\.com|kuaishou\.com/.test(url)) {
            return { parse: 1, url };
        } else if (/miguvideo\.com/.test(url)) {
            return { parse: 1, url, header: { Referer: 'https://www.miguvideo.com/' } };
        }
        return { parse: 1, url };
    },

    搜索: 'ul.ent&&li.lite;h2 a&&Text;;.lite_bot .pass_time&&Text;h2 a&&href',
};