var rule = {
    title:'篮球录像吧',
    host:'https://www.luxiangwu.com/',
    url:'/fyclass',
    class_name:'NBA录像&CBA录像',
    class_url:'nbaluxiang&cbaluxiang',
    homeUrl:'/',
    headers:{
        'User-Agent':'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        // "Cookie": "searchneed=ok"  // 可先注释测试
    },
    timeout:5000,
    play_parse:false,   // 关键！直链播放
    // lazy:'',        // 无需
    limit:6,
    double:false,
    推荐:'/',
    一级:"js:var items=[];pdfh=jsp.pdfh;pdfa=jsp.pdfa;pd=jsp.pd;var html=request(input);var tabs=pdfa(html,'body&&.post');tabs.forEach(function(it){var title=pdfh(it,'h2&&Text');var teams=pdfa(it,'.bs_duiwu span');var home=teams.length>0?pdfh(teams[0],'text'):'?';var away=teams.length>1?pdfh(teams[1],'text'):'?';var timer=pdfh(it,'.a&&Text')||'';var img=pd(it,'.bs_duiwu img&&data-original');var url=pd(it,'a&&href');items.push({desc:timer,title:title+' ('+home+'🆚'+away+')',pic_url:img,url:url})});setResult(items);",
    二级:{
        title:"h1&&Text;.entry p:eq(0)&&Text",
        content:".post h2&&Text",
        tabs:"js:TABS=['直播源']",
        lists:"js:let d=[];let ps=pdfa(html,'.entry p:gt(0)');ps.forEach(p=>{let links=pdfa(p,'a');links.forEach(a=>{d.push({title:pdfh(a,'text'),url:pdfh(a,'href')})})});LISTS=[d];",
    },
    // 搜索支持（如需）
    // 搜索:'/e/search/index.php?keyboard=**&show=title&tempid=1&tbname=article',
    // 搜索url:'/e/search/result/?searchid=**',
};