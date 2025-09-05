/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '古诗鉴赏',
  lang: 'dr2'
})
*/

var rule = {
    title:'古诗鉴赏',
    detailUrl:'fyid',
    class_name:'推荐&分类&诗人&朝代',
    class_url:'544&543&552&547',
    headers:{
        'User-Agent':'MOBILE_UA'
    },
    timeout:5000,
    limit:6,
    play_parse: true,
    lazy: $js.toString(() => {
    input = {
        parse: 0,
        jx: 0,
        url: input
    };
}),
    推荐:$js.toString(()=>{
        let d=[];
        let data=JSON.parse(request('http://dbfm.taikeji.com/v1/poemcate')).data
        data.forEach(a=>{
            if(a.id=='552'){
                a.items[0].items.forEach(b=>{
                    d.push({
                        title:b.title,
                        img:b.pic,
                        url:a.id+','+a.items[0].id+','+b.id
                    })
                })
            }
        })      
        setResult(d)
    }),
    一级:$js.toString(()=>{
        let d=[];
        if(MY_PAGE==1){
        let data=JSON.parse(request('http://dbfm.taikeji.com/v1/poemcate?channel=znds&deviceid=d652f03ce6c89719886dc199c0724b19&model=V1990A&packagename=com.monster.tvfm&random=1727208873340&sdkinfo=10&sdkint=29&vcode=2&vname=1.0.1')).data
        data.forEach(a=>{
            if(a.id==MY_CATE){
                a.items[0].items.forEach(b=>{
                    d.push({
                        title:b.title,
                        img:b.pic,
                        url:a.id+','+a.items[0].id+','+b.id
                    })
                })
            }
        })
        }              
        setResult(d)
    }),
    二级:$js.toString(()=>{                              
       let data=JSON.parse(request('http://dbfm.taikeji.com/v1/poem?cateid='+input+'&limit=100&page=1')).data.list
        VOD.vod_play_from='中国古诗';          
        VOD.vod_play_url=data.map(it=>{return it.title+'-'+it.dynasty+'-'+it.author+'$'+it.source}).join('#')
    }),
    搜索:$js.toString(()=>{     
    }),
}