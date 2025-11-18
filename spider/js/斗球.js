/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '篮球录像吧',
  lang: 'ds'
})
*/
var rule = {
    title: '篮球录像吧',
    host: 'https://www.luxiangwu.com',
    url: '/fyclass',
    class_name: 'NBA录像&CBA录像&今日直播',
    class_url: 'nbaluxiang&cbaluxiang&zhibo',
    homeUrl: '/',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.92 Mobile Safari/537.36',
    },
    timeout: 8000,
    play_parse: false,
    lazy: '',
    limit: 6,
    // 推荐首页内容
    推荐: {
        url: '/',
        一级: ".post;h2 a&&Text;.bs_duiwu img&&data-original;.a&&Text;h2 a&&href",
        模板: 'img_3_line'
    },

    // 一级列表：精准提取主客队、时间、分类
    一级: {
        _name: "列表",
        _jstype: "array",
        _path: ".post",
        _item: {
            title: "js:let t=pdfh(it,'h2 a&&Text');let spans=pdfa(it,'.bs_duiwu span');let h=spans[0]?pdfh(spans[0],'text'):'?';let a=spans[1]?pdfh(spans[1],'text'):'?';t.replace(/录像回放|全场录像|直播回看/g,'').trim()+' （'+h+'🆚'+a+'）'",
            pic_url: ".bs_duiwu img&&data-original",
            desc: "js:pdfh(it,'.a&&Text') + ' | ' + (pdfh(it,'.s_l&&Text')||'')",
            url: "h2 a&&href"
        }
    },

    // 二级详情：只提取有效播放源（m3u8 / 直链）
    二级: {
        title: "h1&&Text;.entry p:eq(0)&&Text",
        content: "js:pdfh(html,'h1&&Text')",
        tabs: ["直播&回放"],
        lists: [
            "js:let d=[];let ps=pdfa(html,'.entry p');let recording=false;ps.forEach(p=>{let txt=pdfh(p,'text');if(txt.includes('信号源')||txt.includes('播放地址')||txt.includes('直播地址')){recording=true;return;}if(recording){let links=pdfa(p,'a');links.forEach(a=>{let t=pdfh(a,'text').trim();let u=pdfh(a,'href');if(u&&u.startsWith('http')&&!u.includes('baidu.com/s/')&&!u.includes('#')){d.push({title:t,url:u})})}});d.length?d:[{title:'暂无有效源',url:'https://example.com/empty.m3u8'}]"
        ]
    },

    // 搜索支持（POST 搜索）
    搜索: {
        url: '/e/search/index.php',
        method: 'post',
        body: 'keyboard=**&show=title&tempid=1&tbname=article',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        一级: ".search-list li;.title&&Text;.img img&&src;.time&&Text;a&&href",
        模板: 'img_3_line'
    },

    // 图片懒加载适配
    isVideo: false, // 不是视频页，不触发嗅探
    lazyRule: '',   // 无 lazy，直链播放
    // 防止跳转中间页
    sniff: true,    // 启用自动嗅探（对咪咕等网页跳转有效）
};

// drpy2 兼容补丁（部分内核需要）
if (typeof $js != 'undefined') {
    var rule = $js.bindJava(rule);
}