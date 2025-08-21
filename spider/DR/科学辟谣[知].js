/*
@header({
  lang: 'dr2'
})
*/

globalThis.getDate=function (time) {//时间戳转日期
    let date = new Date(parseInt(time) * 1000);
    let y = date.getFullYear();
    let MM = date.getMonth() + 1;
    MM = MM < 10 ? ('0' + MM) : MM;
    let d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    let h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    let m = date.getMinutes();
    m = m < 10 ? ('0' + m) : m;
    let s = date.getSeconds();
    s = s < 10 ? ('0' + s) : s;
    return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s;
},
var rule={
title: '科学辟谣',
host: 'https://piyao.kepuchina.cn',
homeUrl:'/h5/ajaxGetMediaList?page=1&page_type=2&title=',
url: '/h5/ajaxGetMediaList?page=fypage&page_type=fyclass&title=',
searchUrl: '/h5/ajaxGetMediaList?page=fypage&page_type=2&title=**',
detailUrl:'/h5/videodetail?id=fyid',
searchable: 2,
quickSearch: 0,
headers: {
    'User-Agent': 'MOBILE_UA',
},
timeout: 5000,
play_parse: true,
class_name: '科学辟谣',
class_url:'2',
推荐: '*',
一级:$js.toString(()=>{
    let d=[];
    let html=request(input);
    let data=JSON.parse(html).data.list;
    data.forEach(it=>{       
        let keywords=it.keywords.map(i=>{return i.keyword}).join('、');
        d.push({
            title:it.title,
            pic_url:it.cover,
            desc:getDate(it.discern_time),
            url:it.id+'&'+getDate(it.discern_time)+'&'+keywords+'&'+it.audit_info+'&'+it.title_pre+'&'+it.origin
        })
    });
    setResult(d);     
    }),
二级:$js.toString(()=>{
    VOD={
        vod_content:input.split('&')[4],
        vod_actor:input.split('&')[3],       
        vod_year:input.split('&')[1],
        type_name:input.split('&')[5],
        vod_remarks:'关键词：'+input.split('&')[2],
        vod_play_from:'科学辟谣',
        vod_play_url:'点击播放$'+input.split('&')[0]
    }   
}),
lazy: $js.toString(() => {
        pdfh = jsp.pdfh;
        pdfa = jsp.pdfa;
        pd = jsp.pd;
        let html = request(input);
        let url = pd(html, '.zy_media #video-el&&src');
        input = {
            parse: 0,
            url: url
        };
    }),
搜索: '*',
}