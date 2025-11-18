var rule = {
    title:'篮球录像吧',
    host:'https://www.luxiangwu.com/',
    url:'/fyclass',     
    class_name:'NBA录像&CBA录像',       
    class_url:'nbaluxiang&cbaluxiang',    
    homeUrl:'/',       
    headers:{
        'User-Agent':'MOBILE_UA',
        "Cookie": "searchneed=ok"
    },     
    timeout:5000,     
    play_parse:true,    
    lazy:'',    
    limit:6,    
    double:false,    
    推荐:'*',
    // --- 🚀 OPTIMIZED PRIMARY LIST RULE BELOW ---
    一级:"js:var items=[];pdfh=jsp.pdfh;pdfa=jsp.pdfa;pd=jsp.pd;var html=request(input);var tabs=pdfa(html,'#content&&.post');tabs.forEach(function(it){var full_title=pdfh(it,'h2&&Text');var url=pd(it,'h2 a&&href');var desc_text=pdfh(it,'small&&Text').trim();var match=full_title.match(/(\\S+vs\\S+)/);var clean_title=match?match[1]:full_title;var date_time=full_title.split(' ')[0]+' '+full_title.split(' ')[1];items.push({desc:date_time+' | '+desc_text.split('丨')[0],title:clean_title,pic_url:'',url:url})});setResult(items);",
    // --- 🚀 END OF OPTIMIZED RULE ---
    二级:{
          title:'.post h2&&Text;.entry p:eq(0)&&Text',  
          content:".post h2&&Text", 
          tabs:"js:TABS=['【直播源】']",
          lists:'.entry p:gt(0):lt(19)',  
          list_text:'a&&Text',
          list_url:'a&&href'
         },
    搜索:'',  
}