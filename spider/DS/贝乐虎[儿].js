/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '贝乐虎[儿]',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',//影视|听书|漫画|小说
    title: '贝乐虎[儿]',
    host: 'https://vd.ubestkid.com',
    url: '/api/v1/bv/video#pg=fypage',
    homeUrl: '/api/v1/bv/video',
    searchable: 0,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'IOS_UA',
    },
    timeout: 5000,
class_parse: async function () {
  let classes = [
    { type_id: '65', type_name: '最新上架' },
    { type_id: '113', type_name: '人气热播' },
    { type_id: '56', type_name: '经典童谣' },
    { type_id: '137', type_name: '开心贝乐虎' },
    { type_id: '53', type_name: '律动儿歌' },
    { type_id: '59', type_name: '经典儿歌' },
    { type_id: '101', type_name: '超级汽车 1' },
    { type_id: '119', type_name: '超级汽车第二季' },
    { type_id: '136', type_name: '超级汽车第三季' },
    { type_id: '95', type_name: '三字经' },
    { type_id: '133', type_name: '幼儿手势舞' },
    { type_id: '117', type_name: '哄睡儿歌' },
    { type_id: '70', type_name: '英文儿歌' },
    { type_id: '116', type_name: '节日与节气' },
    { type_id: '97', type_name: '恐龙世界' },
    { type_id: '55', type_name: '动画片儿歌' },
    { type_id: '57', type_name: '流行歌曲' },
    { type_id: '118', type_name: '贝乐虎入园记' },
    { type_id: '106', type_name: '贝乐虎大百科' },
    { type_id: '62', type_name: '经典古诗' },
    { type_id: '63', type_name: '经典故事' },
    { type_id: '128', type_name: '萌虎学功夫' },
    { type_id: '100', type_name: '绘本故事' },
    { type_id: '121', type_name: '开心贝乐虎英文版' },
    { type_id: '96', type_name: '嗨贝乐虎情商动画' },
    { type_id: '108', type_name: '动物音乐派对' },
    { type_id: '126', type_name: '动物音乐派对英文版' },
    { type_id: '105', type_name: '奇妙的身体' },
    { type_id: '124', type_name: '奇妙的身体英文版' },
    { type_id: '64', type_name: '认知卡片' },
    { type_id: '109', type_name: '趣味简笔画' },
    { type_id: '78', type_name: '数字儿歌' },
    { type_id: '120', type_name: '识字体验版' },
    { type_id: '127', type_name: '启蒙系列体验版' }
  ];
    return {
        class: classes
    };

},
    play_parse: true,
    lazy: async function () {
        let {input} = this;
        return {
            url: input + '#.mp4',
            parse: 0
        }
    },

推荐: async function () {
let {input, MY_CATE, MY_PAGE, MY_FL} = this;
    let pdata = {age: 1, appver: "6.1.9", egvip_status: 0, svip_status: 0, vps: 60, subcateId: 56, p: 1};
    let html = await post(this.input, {data: pdata});
    let json = JSON.parse(html);
    let data = json.result.items;
    let d = [];
    data.forEach(it => {
        let totalCount = it.viewcount;
    let y = (totalCount / 1e8).toFixed(2) +'亿';
    let w = (totalCount / 1e4).toFixed(2) + '万';
    if (totalCount < 1e8) {
        totalCount = w;
    } else {
        totalCount = y;
    }
        d.push({
            vod_id: it.url + '@@' + it.title + '@@' + it.image,
            vod_name: it.title,
            vod_pic: it.image,
            vod_remarks: '👀' + totalCount || ''
        });
    });
    return d;
},
一级: async function () {
        let {input, MY_CATE, MY_PAGE, MY_FL} = this;
        let pdata = {age: 1, appver: "6.1.9", egvip_status: 0, svip_status: 0, vps: 60, subcateId: MY_CATE, p: MY_PAGE};
       // console.log('pdata 结果:', pdata); 
        let requestUrl = input.split('#')[0];
      //  console.log('Request 结果:', requestUrl); 
        let html = await post(requestUrl, {data: pdata});
       // console.log('结果 HTML:', html); 
            let json = JSON.parse(html);
            let data = json.result.items;
          //  console.log('结果 data:', data);
          
            let d = [];
            data.forEach(it => {
    let totalCount = it.viewcount;
    let y = (totalCount / 1e8).toFixed(2) +'亿';
    let w = (totalCount / 1e4).toFixed(2) + '万';
    if (totalCount < 1e8) {
        totalCount = w;
    } else {
        totalCount = y;
    }
    d.push({
        //vod_id: vod_id,
        vod_id: it.url + '@@' + it.title + '@@' + it.image,
        vod_name: it.title,
        vod_pic: it.image,
        vod_remarks: '👀' + totalCount || ''
    });
});
  return d;

},
二级: async function () {
let {input} = this;
//console.log('Request 结果:', input);
const vod = {

      vod_content:'没有二级,只有一级链接直接嗅探播放',
      
      vod_play_from:'道长在线1$',
      vod_play_url:'嗅探播放1$'+ input,
        };

    
    return vod;
	}

}