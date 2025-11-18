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
    title: '斗球[錄像]',
    host: 'https://www.dooqiu.com',
    homeUrl: '/',
    // ★★★ 关键修正：真实分类路径为 /nbaluxiang/，非 /a/nbalx/
    url: function (params) {
        let { class: cls, page } = params;
        // 根据分页链接 '/nbaluxiang/list_19_2.html' 推断 categoryId
        let categoryId = { 
            'nbaluxiang': '19',
            'cbaluxiang': '20',
            'zqluxiang': '21'
        }[cls] || '19';
        
        if (page === 1) {
            return `/${cls}/`;
        } else {
            return `/${cls}/list_${categoryId}_${page}.html`;
        }
    },
    detailUrl: '',
    searchUrl: '/search?keyword=**',
    searchable: 2,
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    },
    timeout: 5000,
    
    // ★★ 修正 class_url：使用真实路径名
    class_name: 'NBA錄像&CBA錄像&足球錄像',
    class_url: 'nbaluxiang&cbaluxiang&zqluxiang', 
    
    double: true,
    limit: 20,
    play_parse: true,

    // ★ 一级：精准取首个区块 + 去重
    一级: function (s) {
        // 定位第一个 .list.nbalx 内的 ul.ent（避免底部重复）
        let list = pdfa(s.data, '.list.nbalx:first ul.ent li.lite');
        let seen = new Set();
        let result = [];
        
        list.forEach(item => {
            let url = pdfh(item, 'h2 a&&href').trim();
            if (!url || seen.has(url)) return;
            seen.add(url);
            
            result.push({
                title: pdfh(item, 'h2 a&&Text').trim(),
                url: url,
                content: pdfh(item, '.pass_time&&Text').trim()
            });
        });
        
        return { list: result };
    },

    // ★ 推荐：同理，取首页首个区块前6条
    推荐: function (s) {
        let list = pdfa(s.data, '.list.nbalx:first ul.ent li.lite').slice(0, 6);
        let result = [];
        let seen = new Set();
        
        list.forEach(item => {
            let url = pdfh(item, 'h2 a&&href').trim();
            if (!url || seen.has(url)) return;
            seen.add(url);
            
            result.push({
                title: pdfh(item, 'h2 a&&Text').trim(),
                url: url,
                content: pdfh(item, '.pass_time&&Text').trim()
            });
        });
        
        return { list: result };
    },

    // ★ 二级：强健容错版（适配微博/腾讯/快手/集锦多 h2 分区）
    二级: {
        title: "h2:eq(0)&&Text",
        desc: "p:eq(0)&&Text",
        content: "p:eq(0)&&Text",
        tabs: function (html) {
            let signals = pdfh(html, 'div.signals&&html') || '';
            if (!signals) return ['视频源'];
            
            // 提取所有 <h2> 文本
            let matches = [...signals.matchAll(/<h2[^>]*>([^<]+?)<\/h2>/gi)];
            let tabs = matches.map(m => m[1].trim()).filter(x => x);
            return tabs.length ? tabs : ['视频源'];
        },
        lists: function (html, tabs) {
            let signals = pdfh(html, 'div.signals&&html') || '';
            if (!signals) return { '视频源': [] };

            // 标准化：插入分隔符切块
            signals = signals.replace(/\s+/g, ' ')
                             .replace(/<\/?[a-z]+>\s*<h2/gi, '<SPLIT><h2')
                             .replace(/<h2/gi, '<SPLIT><h2');

            let blocks = signals.split('<SPLIT>').filter(Boolean);
            let result = {};
            let currentTab = '视频源';

            blocks.forEach(block => {
                // 更新分组
                let h2m = block.match(/<h2[^>]*>([^<]+?)<\/h2>/i);
                if (h2m) {
                    currentTab = h2m[1].trim() || '其他';
                    if (!result[currentTab]) result[currentTab] = [];
                }

                // 提取所有 <a>
                let links = [...block.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
                links.forEach(m => {
                    let url = m[1];
                    let text = m[2]
                        .replace(/<[^>]+>/g, '') // 去除 <span> 等标签
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

    // ★ lazy：增强支持微博、快手、腾讯
    lazy: function (input) {
        let url = input;
        if (/v\.qq\.com|weibo\.com|kuaishou\.com|miguvideo\.com/.test(url)) {
            return { parse: 1, url };
        }
        return { parse: 1, url };
    },

    // 搜索：与一级同逻辑
    搜索: function (s) {
        let list = pdfa(s.data, '.list.nbalx:first ul.ent li.lite');
        let seen = new Set();
        let result = [];
        
        list.forEach(item => {
            let url = pdfh(item, 'h2 a&&href').trim();
            if (!url || seen.has(url)) return;
            seen.add(url);
            
            result.push({
                title: pdfh(item, 'h2 a&&Text').trim(),
                url: url,
                content: pdfh(item, '.pass_time&&Text').trim()
            });
        });
        
        return { list: result };
    }
};