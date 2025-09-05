/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '甜圈短剧[短]',
  lang: 'ds'
})
*/

globalThis.h_ost = 'https://mov.cenguigui.cn';
var rule = {
    title: '甜圈短剧[短]',
    host: h_ost,
    searchUrl: '/duanju/api.php?name=**&page=fypage',
    url: '/duanju/api.php?classname=fyclass&offset=fypage',
    headers: {
        'User-Agent': 'okhttp/3.12.11',
    },

    timeout: 5000,
    filterable: 1,
    limit: 20,
    multi: 1,
    searchable: 2,
    play_parse: 1,
    class_parse: async function () {
    let classes = [];
    const classMap = {
    '🔥 推荐榜': '推荐榜',
    '🎬 新剧': '新剧',
    '🎬 逆袭': '逆袭',
    '🎬 霸总': '霸总',
    '🎬 现代言情': '现代言情',
    '🎬 打脸虐渣': '打脸虐渣',
    '🎬 豪门恩怨': '豪门恩怨',
    '🎬 神豪': '神豪',
    '🎬 马甲': '马甲',
    '🎬 都市日常': '都市日常',
    '🎬 战神归来': '战神归来',
    '🎬 小人物': '小人物',
    '🎬 女性成长': '女性成长',
    '🎬 大女主': '大女主',
    '🎬 穿越': '穿越',
    '🎬 都市修仙': '都市修仙',
    '🎬 强者回归': '强者回归',
    '🎬 亲情': '亲情',
    '🎬 古装': '古装',
    '🎬 重生': '重生',
    '🎬 闪婚': '闪婚',
    '🎬 赘婿逆袭': '赘婿逆袭',
    '🎬 虐恋': '虐恋',
    '🎬 追妻': '追妻',
    '🎬 天下无敌': '天下无敌',
    '🎬 家庭伦理': '家庭伦理',
    '🎬 萌宝': '萌宝',
    '🎬 古风权谋': '古风权谋',
    '🎬 职场': '职场',
    '🎬 奇幻脑洞': '奇幻脑洞',
    '🎬 异能': '异能',
    '🎬 无敌神医': '无敌神医',
    '🎬 古风言情': '古风言情',
    '🎬 传承觉醒': '传承觉醒',
    '🎬 现言甜宠': '现言甜宠',
    '🎬 奇幻爱情': '奇幻爱情',
    '🎬 乡村': '乡村',
    '🎬 历史古代': '历史古代',
    '🎬 王妃': '王妃',
    '🎬 高手下山': '高手下山',
    '🎬 娱乐圈': '娱乐圈',
    '🎬 强强联合': '强强联合',
    '🎬 破镜重圆': '破镜重圆',
    '🎬 暗恋成真': '暗恋成真',
    '🎬 民国': '民国',
    '🎬 欢喜冤家': '欢喜冤家',
    '🎬 系统': '系统',
    '🎬 真假千金': '真假千金',
    '🎬 龙王': '龙王',
    '🎬 校园': '校园',
    '🎬 穿书': '穿书',
    '🎬 女帝': '女帝',
    '🎬 团宠': '团宠',
    '🎬 年代爱情': '年代爱情',
    '🎬 玄幻仙侠': '玄幻仙侠',
    '🎬 青梅竹马': '青梅竹马',
    '🎬 悬疑推理': '悬疑推理',
    '🎬 皇后': '皇后',
    '🎬 替身': '替身',
    '🎬 大叔': '大叔',
    '🎬 喜剧': '喜剧',
    '🎬 剧情': '剧情'
};
    
    // 遍历 classMap 中的每个键值对
    for (const key in classMap) {
        if (classMap.hasOwnProperty(key)) {
            classes.push({
                type_name: key,
                type_id: classMap[key]
            });
        }
    }
    
    return {
        class: classes
    };
},
    lazy: async function () {
        let {input} = this;
        return {
            parse: 0,
            url: `https://mov.cenguigui.cn/duanju/api.php?video_id=${input}&type=mp4`
        };
    },
    一级: async function () {
        const { input } = this;
        const d = [];
        const html = await request(input, { headers: this.headers });
        const data = JSON.parse(html).data;
        data.forEach((it) => {
            d.push({
                title: it.title,
                img: it.cover,
                year: it.copyright,
                desc: it.sub_title,
                url: it.book_id
            });
        });
        return setResult(d);
    },
    二级: async function () {
        let { orId } = this;
        let url = `https://mov.cenguigui.cn/duanju/api.php?book_id=${orId}`;
        let item = JSON.parse(await request(url));
        let VOD = {
            vod_name: item.book_name,
            type_name: item.category,
            vod_pic: item.book_pic,
            vod_content: item.desc,
            vod_remarks: item.duration,
            vod_year: '更新时间:' + item.time,
            vod_actor: item.author
        };
        let playUrls = item.data.map(item => `${item.title}$${item.video_id}`);
        VOD.vod_play_from = '甜圈短剧';
        VOD.vod_play_url = playUrls.join("#");
        return VOD;
    },
    搜索: async function () {
        const { input } = this;
        const d = [];
        const html = await request(input, { headers: this.headers });
        const data = JSON.parse(html).data;
        data.forEach((it) => {
            d.push({
                title: it.title,
                img: it.cover,
                year: it.author,
                desc: it.type,
                url: it.book_id
            });
        });
        return setResult(d);
    }
};