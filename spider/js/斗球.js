/*
@header({
  title: '🏀 篮球录像吧',
  searchable: 2,
  quickSearch: 0,
  filterable: 0,
  lang: 'zh'
})
*/

var rule = {
    title: '🏀 篮球录像吧',
    host: 'https://www.luxiangwu.com',
    homeUrl: '/',
    url: '/fyclass',
    class_name: 'NBA录像&CBA录像',
    class_url: 'nbaluxiang&cbaluxiang',
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Referer': 'https://www.luxiangwu.com/'
    },
    timeout: 6000,
    play_parse: false,  // 多为 m3u8 直链，无需服务器解析
    limit: 6,
    double: false,

    // ========== 推荐：首页最新录像 ==========
    推荐: async function () {
        let { input, pdfa, pdfh, pd } = this;
        let html = await request(input);
        let list = pdfa(html, 'body div:has(>h2>a):has(.a)');  // 精准定位 .post 等效结构
        let d = list.map(it => {
            let titleFull = pdfh(it, 'h2 a&&Text');  // "2025年11月18日 NBA常规赛 公牛vs掘金 全场录像回放"
            let timeCat = pdfh(it, '.a&&Text');      // "4小时前" 或 "昨天 (11-17)"
            let cate = pdfh(it, ':contains("分类：") + a&&Text') || '录像';
            let url = pdfh(it, 'h2 a&&href');
            // 提取主客队（用正则）
            let teams = titleFull.match(/(\S+)vs(\S+)/);
            let home = teams ? teams[1] : '?';
            let away = teams ? teams[2] : '?';
            // 简化标题：去掉日期+年份+NBA/CBA+类型
            let cleanTitle = titleFull.replace(/^\d{4}年\d{1,2}月\d{1,2}日\s*/, '')
                .replace(/(NBA|CBA)(常规赛|东部NBA杯|西部NBA杯)?\s*/, '')
                .replace(/\s*全场录像回放$/, '');
            return {
                title: cleanTitle + '（' + home + '🆚' + away + '）',
                desc: timeCat + ' | ' + cate,
                pic_url: 'https://www.luxiangwu.com/favicon.ico', // 无图，用 favicon 占位
                url: url
            };
        }).filter(it => it.url);
        return setResult(d);
    },

    // ========== 一级：分类页 ==========
    一级: async function (params) {
        let { input } = params;
        // 复用推荐逻辑（分类页结构与首页一致）
        return this.推荐(input);
    },

    // ========== 二级：详情页提取播放源 ==========
    二级: {
        title: "h1&&Text;:contains('比赛时间')&&Text",
        content: "h1&&Text",
        tabs: ["直播 & 回放源"],
        lists: [
            "js:let d=[];let ps=document.querySelectorAll('.entry p');let start=false;for(let p of ps){let txt=p.innerText;if(txt.includes('直播/回放信号源')||txt.includes('播放地址')){start=true;continue;}if(start){p.querySelectorAll('a[href]').forEach(a=>{let t=a.innerText.trim(),u=a.href;if(u&&u.startsWith('http'))d.push({title:t,url:u})})}};if(d.length===0)d.push({title:'暂无源',url:'https://example.com/empty.m3u8'});d"
        ]
    },

    // ========== 搜索：站内无搜索框，用模糊匹配模拟 ==========
    搜索: async function (params) {
        let { input } = params;
        let html = await request(this.homeUrl);
        let list = pdfa(html, 'body div:has(>h2>a):has(.a)');
        let d = list.map(it => {
            let title = pdfh(it, 'h2 a&&Text');
            let time = pdfh(it, '.a&&Text');
            let url = pdfh(it, 'h2 a&&href');
            return { title, desc: time, url };
        }).filter(it => it.title.includes(input) || it.url.includes(input));
        return setResult(d);
    }
};