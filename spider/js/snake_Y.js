var rule = {
  title: '毒蛇',
  host: 'https://www.xnhrsb.com/',
  url: '/dsshiyisw/fyclass--------fypage---.html',
  searchUrl: '/dsshiyisc/**----------fypage---.html',
  class_name: '电影&电视剧&综艺&动漫&短剧&豆瓣',
  class_url: '1&2&3&4&5&duoban',
  searchable: 2,
  quickSearch: 0,
  filterable: 0,
  headers: {
    'User-Agent': 'MOBILE_UA',
  },
  play_parse: true,
  // lazy代码:源于海阔香雅情大佬 / 小程序：香情影视 https://pastebin.com/L4tHdvFn
    lazy: `js:
    pdfh = jsp.pdfh;
    var html = request(input);
    var ohtml = pdfh(html, '.videoplay&&Html');
    var iframeSrc = pdfh(ohtml, "body&&iframe&&src");
    if (/Cloud/.test(iframeSrc) || /pla\.py1080p\.com/.test(iframeSrc)) {
        var ifrwy = request(iframeSrc);
        var codeMatch = ifrwy.match(/var\s+url\s*=\s*['"](.*?)['"]/);
        if (codeMatch) {
            let code = codeMatch[1].split('').reverse().join('');
            let temp = '';
            for (let i = 0x0; i < code.length; i = i + 0x2) {
                temp += String.fromCharCode(parseInt(code[i] + code[i + 0x1], 0x10));
            }
            input = {
                jx: 0,
                url: temp.substring(0x0, (temp.length - 0x7)/0x2) + temp.substring((temp.length - 0x7)/0x2 + 0x7),
                parse: 0
            };
        } else {
            input;
        }
    } else if (/decrypted/.test(ohtml)) {
        var phtml = pdfh(ohtml, "body&&script:not([src])&&Html");
        eval(getCryptoJS());
        var scrpt = phtml.match(/var.*?\\)\\);/g)[0];
        var data = [];
        eval(scrpt.replace(/md5/g, 'CryptoJS').replace('eval', 'data = '));
        input = {
            jx: 0,
            url: data.match(/url:\s*['"](.*?)['"]/)[1],
            parse: 0
        };
    } else {
        input;
    }
`,
  limit: 6,
  double: true,
  推荐: '.bt_img;ul&&li;*;*;*;*',
  一级: '.mrb&&ul li;.dytit&&Text;.lazy&&data-original;.hdinfo&&Text;a&&href',
  二级: {
    title: 'h1&&Text;.moviedteail_list li&&a&&Text',
    img: 'div.dyimg img&&src',
    desc: '.moviedteail_list li:eq(3)&&Text;.moviedteail_list li:eq(2)&&Text;.moviedteail_list li:eq(1)&&Text;.moviedteail_list li:eq(6)&&Text;.moviedteail_list li:eq(4)&&Text',
    content: '.yp_context&&Text',
    tabs: '.mi_paly_box .ypxingq_t',
    lists: '.paly_list_btn:eq(#id) a:gt(0)',
  },
   搜索: '.mrb&&ul li;.dytit&&Text;.lazy&&data-original;.hdinfo&&Text;a&&href',
}
