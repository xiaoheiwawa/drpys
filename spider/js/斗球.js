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
    title:'NBA录像屋',
    host:'https://www.nbaluxiangwu.com',
    // 1. 分类/分頁 URL 结构定制
    url: function (params) {
        let { class: cls, page } = params;
        
        // 首页分类路径: /nbalx, /zqlx 等。
        // 分页路径: /nbalx/page/2
        if (page === 1) {
            // 首页 (page=1) 的分类链接就是 host + class_url，例如: https://www.nbaluxiangwu.com/nbalx/
            return `/${cls}/`; 
        } else {
            // 分页链接: https://www.nbaluxiangwu.com/nbalx/page/2
            return `/${cls}/page/${page}`;
        }
    },
    detailUrl: 'fyid', 
    
    // 搜索由于网站使用 GET 参数，不需要定制，但网站首页表单 action="/"，所以搜索结果页路径是 /?s=关键字
    searchUrl:'/index.php?s=**', // 适配 WordPress 的搜索结构
    searchable: 2,
    quickSearch: 0,
    
    // 2. 增加多分类
    class_name:'NBA录像&足球录像&综合录像&体育资讯',
    class_url:'nbalx&zqlx&zhlx&tyzx', // 对应导航栏的路径
    
    headers:{
        'User-Agent':'PC_UA'
    },
    timeout:15000,
    play_parse:true,
    limit:6,
    double:false,
    
    // 3. 修正一级选择器
    // 列表项: article.excerpt.excerpt-one
    // 标题: header h2 a&&Text
    // 图片: a.focus img&&data-original (网站使用了 data-original 延迟加载图片)
    // 备注: div.info time&&Text (时间作为备注)
    // 链接: h2 a&&href
    一级:'.content article.excerpt.excerpt-one;h2 a&&Text;a.focus img&&data-original;div.info time&&Text;h2 a&&href',
    
    // 4. 二级详情页解析
    二级:{
        title:'.news_title&&Text',
        img:'.news_con img&&src', // 图片可能在正文区域
        desc:'',
        content:'div.news_con div.baidu_share&&Text', // 避免抓取到分享按钮的脚本
        // 播放列表: 链接位于 .news_con p/a 下
        lists:'.news_con p', 
        list_text:'a&&Text',
        list_url:'a&&href'
    },
    
    // 5. Lazy 播放解析（外链直透）
    lazy: $js.toString(async () => {
        // 二级页面解析出来的 a&&href 通常是腾讯/快手等外部链接，直接透传给播放器解析
        return { 
            parse: 1, 
            url: input,
            jx: 0 // 标记为不需要二次解析
        };
    }),
    
    // 6. 搜索 (与一级结构相似，只需调整入口)
    搜索: $js.toString(async () => {
        let d = [];
        try {
            let html = await request(input);
            // 搜索结果列表项选择器
            let items = pdfa(html, '.content article.excerpt.excerpt-one');
            
            for (let item of items) {
                d.push({
                    title: pdfh(item, 'h2 a&&Text'),
                    img: pdfh(item, 'a.focus img&&data-original'),
                    content: pdfh(item, 'div.info time&&Text'),
                    url: pdfh(item, 'h2 a&&href')
                });
            }
        } catch (e) {
            console.error('📌 搜索抓取失败:', e.message);
        }
        return setResult(d);
    }),
};