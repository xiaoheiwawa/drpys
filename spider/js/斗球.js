/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: 'NBA录像屋',
  '类型': '体育',
  lang: 'ds'
})
*/

var rule = {
    title: 'NBA录像屋',
    host: 'https://www.nbaluxiangwu.com',
    url: function (params) {
        let { class: cls = 'nbalx', page = 1 } = params;
        return page === 1 ? `/${cls}/` : `/${cls}/page/${page}`;
    },
    detailUrl: 'fyid',
    searchUrl: '/?s=**', // WordPress 搜索标准格式
    searchable: 2,
    quickSearch: 0,
    class_name: 'NBA录像&足球录像&综合录像&体育资讯',
    class_url: 'nbalx&zqlx&zhlx&tyzx',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    },
    timeout: 15000,
    play_parse: true,
    limit: 6,
    double: false,

    // ★★ 木兮风格：推荐（取首页首个分类前6条）
    推荐: $js.toString(async () => {
        let d = [];
        try {
            let html = await request('https://www.nbaluxiangwu.com/nbalx/');
            let matches = [...html.matchAll(/<article\s+class="excerpt[^"]*excerpt-one[^"]*"[^>]*>[\s\S]*?<h2><a\s+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>[\s\S]*?<div\s+class="info">[\s\S]*?<time[^>]*>([^<]+)<\/time>/gi)];
            for (let m of matches.slice(0, 6)) {
                let [_, url, title, time] = m;
                let imgMatch = m[0].match(/<img\s+[^>]*data-original="([^"]+)"/i);
                d.push({
                    title: title.trim(),
                    img: imgMatch ? imgMatch[1] : '',
                    content: time.trim(),
                    url: url
                });
            }
        } catch (e) {
            console.error('📌 推荐抓取失败:', e.message);
        }
        return setResult(d);
    }),

    // ★★ 木兮风格：一级（正则提取，兼容 data-original）
    一级: $js.toString(async () => {
        let d = [];
        try {
            let html = await request(input);
            let matches = [...html.matchAll(/<article\s+class="excerpt[^"]*excerpt-one[^"]*"[^>]*>[\s\S]*?<h2><a\s+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>[\s\S]*?<div\s+class="info">[\s\S]*?<time[^>]*>([^<]+)<\/time>/gi)];
            for (let m of matches) {
                let [_, url, title, time] = m;
                if (!url || !title) continue;
                let imgMatch = m[0].match(/<img\s+[^>]*data-original="([^"]+)"/i);
                d.push({
                    title: title.trim(),
                    img: imgMatch ? imgMatch[1] : '',
                    content: time.trim(),
                    url: url
                });
            }
        } catch (e) {
            console.error('📌 一级抓取失败:', e.message);
        }
        return setResult(d);
    }),

    // ★★ 木兮风格：二级（纯字符串解析，避免 DOM）
    二级: $js.toString(async () => {
        let html = await request(input);
        
        // 标题
        let titleMatch = html.match(/<h1\s+class="news_title"[^>]*>([^<]+)<\/h1>/i);
        let vod_name = titleMatch ? titleMatch[1].trim() : '未知录像';
        
        // 图片（取第一张）
        let imgMatch = html.match(/<div\s+class="news_con"[^>]*>[\s\S]*?<img\s+[^>]*src="([^"]+)"/i);
        let vod_pic = imgMatch ? imgMatch[1] : '';

        // 播放分组（假设无 tabs，全归为「视频源」）
        let playLines = [];
        let aMatches = [...html.matchAll(/<div\s+class="news_con"[^>]*>[\s\S]*?<p>([\s\S]*?<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?)<\/p>/gi)];
        for (let a of aMatches) {
            let text = a[3].trim();
            let url = a[2];
            if (url && text && !url.startsWith('#') && !url.includes('javascript')) {
                playLines.push(`${text}$${url}`);
            }
        }

        return {
            vod_id: input.replace(/^.+\/([^\/]+)\.html?$/, '$1'),
            vod_name: vod_name,
            type_name: '体育',
            vod_pic: vod_pic,
            vod_remarks: '',
            vod_content: '',
            vod_play_from: '视频源',
            vod_play_url: playLines.join('#')
        };
    }),

    // ★★ 木兮风格：搜索（同 一级 逻辑）
    搜索: $js.toString(async () => {
        let d = [];
        try {
            let html = await request(input);
            let matches = [...html.matchAll(/<article\s+class="excerpt[^"]*excerpt-one[^"]*"[^>]*>[\s\S]*?<h2><a\s+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>[\s\S]*?<div\s+class="info">[\s\S]*?<time[^>]*>([^<]+)<\/time>/gi)];
            for (let m of matches) {
                let [_, url, title, time] = m;
                let imgMatch = m[0].match(/<img\s+[^>]*data-original="([^"]+)"/i);
                d.push({
                    title: title.trim(),
                    img: imgMatch ? imgMatch[1] : '',
                    content: time.trim(),
                    url: url
                });
            }
        } catch (e) {
            console.error('📌 搜索失败:', e.message);
        }
        return setResult(d);
    }),

    // ★★ 木兮风格：lazy（外链直透）
    lazy: $js.toString(async () => {
        // 支持腾讯、快手、微博、爱奇艺等主流平台
        return { parse: 1, url: input };
    })
};