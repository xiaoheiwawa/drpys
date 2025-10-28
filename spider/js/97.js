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
    title: '九七电影网(新)',
    host: 'http://n122.com', // ✅ 域名更新
    // host: 'http://96dy.xyz', // 备用域名
    url: '/fyclass/indexfypage.html',
    searchUrl: '/s.asp?page=fypage&searchword=**&searchtype=-1',
    headers: {
        // 使用 PC UA 以避免移动端强制跳转，增加兼容性
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    searchable: 2,
    quickSearch: 0,
    timeout: 5000,
    play_parse: true,
    filterable: 0,
    // 保持原分类不变
    class_name: '动作片&喜剧片&爱情片&科幻片&恐怖片&剧情片&战争片&纪录片&VIP&动画&国产剧&欧美剧&香港剧&韩国剧&台湾剧&日本剧&泰国剧&海外剧&微短剧&国产动漫&日韩动漫&欧美动漫&其他动漫&大陆综艺&香港综艺&台湾综艺&日韩综艺&欧美综艺&其他综艺&理论片&写真&主播',
    class_url: 'dianying/dongzuopian&dianying/xijupian&dianying/aiqingpian&dianying/kehuanpian&dianying/kongbupian&dianying/juqingpian&dianying/zhanzhengpian&dianying/jilupian&dianying/fuli&dianying/dhdy&dianshiju/guochanju&dianshiju/oumeiju&dianshiju/hongkongju&dianshiju/hanguoju&dianshiju/taiwanju&dianshiju/ribengju&dianshiju/taiguoju&dianshiju/haiwaiju&dianshiju/duanju&dongmandonghua/guochandonghua&dongmandonghua/ribendongman&dongmandonghua/oumeidongman&dongmandonghua/qitadongman&zongyiyule/daluzongyi&zongyiyule/hongkongzongyi&zongyiyule/taiwanzongyi&zongyiyule/rihanzongyi&zongyiyule/oumeizongyi&zongyiyule/qitazongyi&wuyejuchang/lunli&wuyejuchang/xiezhen&wuyejuchang/zhubo',

    // ========== 公共函数 ==========
    // 强制使用 gbk 编码，以避免中文乱码（网站原编码）
    _get: async function (url) {
        return await request(url, { charset: 'gbk' });
    },

    // ========== 一级列表 ==========
    一级: async function (tid, pg, filter, extend) {
        let {input} = this;
        let html = await this._get(input);
        let d = [];
        // 确保选择器 ul.list_tab_img li 能够选中列表项
        let items = pdfa(html, 'ul.list_tab_img li');
        
        items.forEach(it => {
            // 优化：优先提取 h2 标签下的 a 文本作为标题，兼容首页/分类页
            let title = pdfh(it, 'h2 a&&Text') || pdfh(it, '.name&&Text') || '未知';
            
            d.push({
                title: title.trim(),
                // data-original 属性提取图片链接
                pic_url: pd(it, '.loading&&data-original'),
                // 提取更新/备注信息，兼容多种结构
                desc: pdfh(it, '.title&&Text') || pdfh(it, '.uptime p&&Text') || pdfh(it, '.status&&Text') || '',
                url: pd(it, 'a&&href')
            });
        });
        // 检查 d 是否为空，并返回结果
        return setResult(d);
    },

    // ========== 二级详情 ==========
    二级: async function (ids) {
        let {input} = this;
        let html = await this._get(input);
        let vod_name = pdfh(html, 'h1&&Text').trim() || '';
        // 简介容错
        let vod_content = pdfh(html, '.v-js.clear.yc p&&Text') || '';

        let sources = pdfa(html, '.vod-info-tab span[id]:has(a)');
        let playFrom = [];
        let playUrl = [];

        sources.forEach(span => {
            let from = pdfh(span, 'a&&Text').trim();
            if (!from) return;
            let id = pd(span, 'span&&id');
            playFrom.push(from);

            // 查找对应的剧集列表容器
            let box = pdfa(html, `.play-box[id="${id}"]`)[0];
            if (!box) return;

            let links = pdfa(box, 'a');
            let urls = links.map(a => {
                let title = pdfh(a, 'a&&title') || pdfh(a, 'a&&Text') || '播放';
                // 使用 pd 自动拼接 host
                let url = pd(a, 'a&&href', input); 
                return title.trim() + '$' + url;
            }).filter(x => x.includes('$')); // 过滤掉无效链接

            playUrl.push(urls.join('#'));
        });

        return {
            vod_name: vod_name,
            vod_content: vod_content,
            vod_play_from: playFrom.join('$$$'),
            vod_play_url: playUrl.join('$$$')
        };
    },

    // ========== 播放解析 (lazy) ==========
    lazy: async function (flag, id, flags) {
        // 如果不是播放页链接，则直接返回
        if (!id || !id.includes('player-')) {
            return { parse: 0, url: id };
        }

        try {
            let html = await this._get(id);
            // 匹配播放器配置JSON
            let match = html.match(/var\s+player_[a-zA-Z0-9_]+\s*=\s*(\{[^}]*\})/);
            
            if (match) {
                let jsonStr = match[1]
                    // 替换单引号为双引号
                    .replace(/'/g, '"')
                    // 移除尾随逗号 (防止 JSON.parse 报错)
                    .replace(/,\s*}/g, '}');
                    
                let data = JSON.parse(jsonStr);
                let url = data.url;

                // 解密逻辑
                if (data.encrypt == "1") {
                    url = unescape(url);
                } else if (data.encrypt == "2") {
                    // Base64 解码需要依赖运行环境的 CryptoJS 库
                    if (typeof CryptoJS !== 'undefined') {
                        url = CryptoJS.enc.Base64.parse(url).toString(CryptoJS.enc.Utf8);
                        url = unescape(url);
                    } else {
                        log('九七 lazy error: 缺少 CryptoJS 库');
                        return { parse: 0, url: id };
                    }
                }

                if (url) {
                    return { parse: 0, url: url }; // parse: 0 表示无需系统再次解析
                }
            }
        } catch (e) {
            log('九七 lazy error: ' + e.message);
        }

        return { parse: 0, url: id };
    },

    // ========== 搜索 ==========
    // 搜索逻辑与一级列表相同，仅 input 变量来源不同
    搜索: async function (wd, quick, pg) {
        let {input} = this;
        let html = await this._get(input);
        let d = [];
        let items = pdfa(html, 'ul.list_tab_img li');
        
        items.forEach(it => {
            let title = pdfh(it, 'h2 a&&Text') || pdfh(it, '.name&&Text') || '未知';
            
            d.push({
                title: title.trim(),
                pic_url: pd(it, '.loading&&data-original'),
                desc: pdfh(it, '.title&&Text') || pdfh(it, '.uptime p&&Text') || '',
                url: pd(it, 'a&&href')
            });
        });
        return setResult(d);
    }
};