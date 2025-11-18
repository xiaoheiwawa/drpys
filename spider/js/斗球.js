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
    // ★★ 木兮风格：url 为 function，显式可控
    url: function (params) {
        let { class: cls = 'nbaluxiang', page = 1 } = params;
        let categoryId = { 'nbaluxiang': '19', 'cbaluxiang': '20', 'zqluxiang': '21' }[cls] || '19';
        return page === 1 ? `/${cls}/` : `/${cls}/list_${categoryId}_${page}.html`;
    },
    detailUrl: 'fyid', // fyid 为完整路径如 /a/10262.html
    searchUrl: '/search?keyword=**',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Referer': 'https://www.dooqiu.com/'
    },
    timeout: 8000,
    play_parse: true,

    class_name: 'NBA錄像&CBA錄像&足球錄像',
    class_url: 'nbaluxiang&cbaluxiang&zqluxiang',

    // ★★ 木兮风格：推荐 - async + try/catch + setResult
    推荐: $js.toString(async () => {
        let d = [];
        try {
            let html = await request(input);
            // 正则提取首个区块的 6 条（去重）
            let matches = [...html.matchAll(/<li\s+class="lite"[^>]*>[\s\S]*?<h2>\s*<a\s+href=['"]([^"']+)['"][^>]*>([^<]+)<\/a>[\s\S]*?<span\s+class="pass_time">([^<]+)<\/span>/gi)];
            let seen = new Set();
            for (let m of matches) {
                let [_, url, title, time] = m;
                if (!url || !title || seen.has(url)) continue;
                seen.add(url);
                d.push({ title: title.trim(), url: url, content: time.trim() });
                if (d.length >= 6) break;
            }
        } catch (e) {
            console.error('📌 推荐抓取失败:', e.message);
        }
        return setResult(d);
    }),

    // ★★ 木兮风格：一级 - async + 正则 + 去重
    一级: $js.toString(async () => {
        let d = [];
        try {
            let html = await request(input);
            let matches = [...html.matchAll(/<li\s+class="lite"[^>]*>[\s\S]*?<h2>\s*<a\s+href=['"]([^"']+)['"][^>]*>([^<]+)<\/a>[\s\S]*?<span\s+class="pass_time">([^<]+)<\/span>/gi)];
            let seen = new Set();
            for (let m of matches) {
                let [_, url, title, time] = m;
                if (!url || !title || seen.has(url) || !url.startsWith('/a/')) continue;
                seen.add(url);
                d.push({ title: title.trim(), url: url, content: time.trim() });
            }
        } catch (e) {
            console.error('📌 一级抓取失败:', e.message);
        }
        return setResult(d);
    }),

    // ★★ 木兮风格：二级 - 纯字符串分段解析，无 DOM
    二级: $js.toString(async () => {
        let html = await request(input);
        // 提取标题 & 时间
        let titleMatch = html.match(/<h2>([^<]+)<\/h2>/i);
        let timeMatch = html.match(/<p[^>]*>(\d{4}-\d{2}-\d{2})[^<]*<\/p>/i);
        let vod_name = titleMatch ? titleMatch[1].trim() : '未知录像';
        let vod_remarks = timeMatch ? timeMatch[1] : '';

        // 解析 signals 分组
        let signalsMatch = html.match(/<div\s+class="signals"[^>]*>([\s\S]*?)<\/div>/i);
        let tabs = [], urls = [];

        if (signalsMatch) {
            let signals = signalsMatch[1];
            // 按 <h2> 切分块
            let blocks = signals.split(/<h2[^>]*>/gi).slice(1); // 首块为空
            for (let block of blocks) {
                let h2End = block.indexOf('</h2>');
                if (h2End === -1) continue;
                let tabName = block.substring(0, h2End).trim();
                if (!tabName) continue;
                tabs.push(tabName);

                let links = [];
                let aMatches = [...block.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
                for (let a of aMatches) {
                    let url = a[1];
                    let text = a[2]
                        .replace(/<[^>]+>/g, '') // 去标签
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (url && text && !url.includes('javascript')) {
                        links.push(`${text}$${url}`);
                    }
                }
                urls.push(links.join('#'));
            }
        }

        return {
            vod_id: input.replace(/^.*?\/a\/(\d+)\.html.*$/, '$1'),
            vod_name: vod_name,
            type_name: '體育',
            vod_pic: '',
            vod_remarks: vod_remarks,
            vod_content: '',
            vod_play_from: tabs.join('$$$'),
            vod_play_url: urls.join('$$$')
        };
    }),

    // ★★ 木兮风格：搜索 - 同一级逻辑
    搜索: $js.toString(async () => {
        let d = [];
        try {
            let html = await request(input);
            let matches = [...html.matchAll(/<li\s+class="lite"[^>]*>[\s\S]*?<h2>\s*<a\s+href=['"]([^"']+)['"][^>]*>([^<]+)<\/a>[\s\S]*?<span\s+class="pass_time">([^<]+)<\/span>/gi)];
            for (let m of matches) {
                let [_, url, title, time] = m;
                if (url && title && url.startsWith('/a/')) {
                    d.push({ title: title.trim(), url: url, content: time.trim() });
                }
            }
        } catch (e) {
            console.error('📌 搜索失败:', e.message);
        }
        return setResult(d);
    }),

    // ★★ 木兮风格：lazy - 直透外部链接
    lazy: $js.toString(async () => {
        // input 即为真实外链（腾讯/微博/快手）
        return { parse: 1, url: input }; // 交由播放器解析
    })
};