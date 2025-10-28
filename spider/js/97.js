/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '九七电影网',
  lang: 'ds'
})
*/

var rule = {
    title: '九七电影网',
    host: 'http://97dv.com',  // ✅ 使用主站域名
    url: '/fyclass/indexfypage.html',
    searchUrl: '/s.asp?page=fypage&searchword=**&searchtype=-1',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    },
    searchable: 2,
    quickSearch: 0,
    timeout: 5000,
    play_parse: true,
    filterable: 0,
    class_name: '动作片&喜剧片&爱情片&科幻片&恐怖片&剧情片&战争片&纪录片&VIP&动画&国产剧&欧美剧&香港剧&韩国剧&台湾剧&日本剧&泰国剧&海外剧&微短剧&国产动漫&日韩动漫&欧美动漫&其他动漫&大陆综艺&香港综艺&台湾综艺&日韩综艺&欧美综艺&其他综艺&理论片&写真&主播',
    class_url: 'dianying/dongzuopian&dianying/xijupian&dianying/aiqingpian&dianying/kehuanpian&dianying/kongbupian&dianying/juqingpian&dianying/zhanzhengpian&dianying/jilupian&dianying/fuli&dianying/dhdy&dianshiju/guochanju&dianshiju/oumeiju&dianshiju/hongkongju&dianshiju/hanguoju&dianshiju/taiwanju&dianshiju/ribengju&dianshiju/taiguoju&dianshiju/haiwaiju&dianshiju/duanju&dongmandonghua/guochandonghua&dongmandonghua/ribendongman&dongmandonghua/oumeidongman&dongmandonghua/qitadongman&zongyiyule/daluzongyi&zongyiyule/hongkongzongyi&zongyiyule/taiwanzongyi&zongyiyule/rihanzongyi&zongyiyule/oumeizongyi&zongyiyule/qitazongyi&wuyejuchang/lunli&wuyejuchang/xiezhen&wuyejuchang/zhubo',

    // ========== 公共函数 ==========
    _get: async function (url) {
        return await request(url, { charset: 'gbk' });
    },

    // ========== 一级列表 ==========
    一级: async function (tid, pg, filter, extend) {
        let {input} = this;
        let html = await this._get(input);
        let d = [];
        let items = pdfa(html, 'ul.list_tab_img li');
        items.forEach(it => {
            d.push({
                title: pdfh(it, '.name&&Text') || pdfh(it, 'h2 a&&Text') || '未知',
                pic_url: pd(it, '.loading&&data-original'),
                desc: pdfh(it, '.title&&Text') || '',
                url: pd(it, 'a&&href')
            });
        });
        return setResult(d);
    },

    // ========== 二级详情 ==========
    二级: async function (ids) {
        let {input} = this;
        let html = await this._get(input);
        let vod_name = pdfh(html, 'h1&&Text');
        let vod_content = pdfh(html, '.v-js.clear.yc p&&Text') || '';

        let sources = pdfa(html, '.vod-info-tab span[id]:has(a)');
        let playFrom = [];
        let playUrl = [];

        sources.forEach(span => {
            let from = pdfh(span, 'a&&Text').trim();
            if (!from) return;
            let id = pd(span, 'span&&id');
            playFrom.push(from);

            let box = pdfa(html, `.play-box[id="${id}"]`)[0];
            if (!box) return;

            let links = pdfa(box, 'a');
            let urls = links.map(a => {
                let title = pdfh(a, 'a&&title') || pdfh(a, 'a&&Text') || '播放';
                let url = pd(a, 'a&&href', input);
                return title + '$' + url;
            }).filter(x => x.includes('$'));

            playUrl.push(urls.join('#'));
        });

        return {
            vod_name: vod_name,
            vod_content: vod_content,
            vod_play_from: playFrom.join('$$$'),
            vod_play_url: playUrl.join('$$$')
        };
    },

    // ========== 播放解析 ==========
    lazy: async function (flag, id, flags) {
        if (!id || !id.includes('player-')) {
            return { parse: 0, url: id };
        }

        try {
            let html = await this._get(id);
            let match = html.match(/var\s+player_[a-zA-Z0-9_]+\s*=\s*(\{[^}]*\})/);
            if (match) {
                let jsonStr = match[1]
                    .replace(/'/g, '"')
                    .replace(/,\s*}/g, '}');
                let data = JSON.parse(jsonStr);
                let url = data.url;

                if (data.encrypt == "1") {
                    url = unescape(url);
                } else if (data.encrypt == "2") {
                    // Base64 解码
                    url = CryptoJS.enc.Base64.parse(url).toString(CryptoJS.enc.Utf8);
                    url = unescape(url);
                }

                if (url) {
                    return { parse: 0, url: url };
                }
            }
        } catch (e) {
            log('九七 lazy error: ' + e.message);
        }

        return { parse: 0, url: id };
    },

    // ========== 搜索 ==========
    搜索: async function (wd, quick, pg) {
        let {input} = this;
        let html = await this._get(input);
        let d = [];
        let items = pdfa(html, 'ul.list_tab_img li');
        items.forEach(it => {
            d.push({
                title: pdfh(it, '.name&&Text') || pdfh(it, 'h2 a&&Text') || '未知',
                pic_url: pd(it, '.loading&&data-original'),
                desc: pdfh(it, '.title&&Text') || '',
                url: pd(it, 'a&&href')
            });
        });
        return setResult(d);
    }
};