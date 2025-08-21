"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '首页',
  lang: 'hipy'
})
"""

# coding = utf-8
#!/usr/bin/python
# 新时代青年 2025.06.25 getApp第三版
# 2025.07.25 增加API类型自动检测功能
# 2025.07.26 增加线路排序和排除功能
import re,sys,uuid,json,base64,urllib3
from Crypto.Cipher import AES
from base.spider import Spider
from Crypto.Util.Padding import pad,unpad
sys.path.append('..')
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

headerx = {
    'User-Agent': 'okhttp/3.10.0'
}

class Spider(Spider):
    global headerx
    init_data = ''
    search_verify = ''
    api_type = 'getappapi'
    
    # 线路排除规则配置
    EXCLUDE_PATTERNS = [
        r'排除线路1',          
        r'排除线路2',         
        r'排除线路3',         
    ]
    
    PRIORITY_LIST = ['排序线路1', '排序线路2', '排序线路3']

    def getName(self):
        return "首页"


    def detect_api_type(self, host):
        test_apis = [
        '/api.php/getappapi.index/searchList',
        '/api.php/qijiappapi.index/searchList'
     ]
        api_type = None

        for api in test_apis:
            test_url = f"{host}{api}"
            try:
                print(f"[API检测] 开始检测: {test_url}")
                response = self.fetch(test_url, headers=headerx, timeout=3, verify=False)
                
                # Check if response is HTML
                if response.text.strip().startswith('<'):
                    print(f"[API检测] {test_url} 返回HTML，跳过")
                    continue

                try:
                    json_res = response.json()
                except json.JSONDecodeError as parse_err:
                    print(f"[API检测] {test_url} JSON解析失败: {str(parse_err)}")
                    continue

                # Check for data field
                if 'data' not in json_res:
                    print(f"[API检测] {test_url} 无data字段，跳过")
                    continue

                code = json_res.get('code')
                if code:
                    api_type = 'getappapi' if 'getappapi' in api else 'qijiappapi'
                    print(f"[API检测] 成功！{test_url} 类型: {api_type}")
                    return api_type
                else:
                    print(f"[API检测] {test_url} code不为0，跳过")

            except Exception as err:
                print(f"[API检测] {test_url} 发生错误: {str(err)}")
                continue

        print("[API检测] 所有接口检测失败")
        return 'qijiappapi'

    def init(self, extend):
        try:
            js1 = json.loads(extend)
            host = js1.get('host') or js1.get('url') or js1.get('site')
            if not re.match(r'^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(:\d+)?(\/)?$', host):
                try:
                    host = self.fetch(host, headers=headerx, timeout=10, verify=False).text.rstrip('/')
                except:
                    pass
            self.key = js1['datakey']
            self.iv = js1.get('dataiv', self.key)
            api_type = self.detect_api_type(host)
            self.xurl = host + f'/api.php/{api_type}'
            init_url = f'{self.xurl}.index/initV119'
            res = self.fetch(init_url, headers=headerx, verify=False)
            if res.status_code != 200:
                alt_api = 'qijiappapi' if api_type == 'getappapi' else 'getappapi'
                alt_url = host + f'/api.php/{alt_api}.index/initV119'
                res = self.fetch(alt_url, headers=headerx, verify=False)
                if res.status_code == 200:
                    self.xurl = host + f'/api.php/{alt_api}'
            res_data = res.json()
            encrypted_data = res_data['data']
            response = self.decrypt(encrypted_data)
            self.init_data = json.loads(response)
            self.search_verify = self.init_data['config'].get('system_search_verify_status', False)
        except:
            self.init_data = {'type_list': [], 'recommend_list': [], 'config': {}}
            self.search_verify = False

    def homeContent(self, filter):
        kjson = self.init_data
        result = {"class": [], "filters": {}}
        for i in kjson.get('type_list', []):
            type_name = i.get('type_name', '')
            if not(type_name in {'全部', 'QQ', 'juo.one'} or '企鹅群' in type_name):
                result['class'].append({
                    "type_id": i.get('type_id', ''),
                    "type_name": type_name
                })
            name_mapping = {'class': '类型', 'area': '地区', 'lang': '语言', 'year': '年份', 'sort': '排序'}
            filter_items = []
            for filter_type in i.get('filter_type_list', []):
                filter_name = filter_type.get('name')
                values = filter_type.get('list', [])
                if not values:
                    continue
                value_list = [{"n": value, "v": value} for value in values]
                display_name = name_mapping.get(filter_name, filter_name)
                key = 'by' if filter_name == 'sort' else filter_name
                filter_items.append({
                    "key": key,
                    "name": display_name,
                    "value": value_list
                })
            type_id = i.get('type_id')
            if filter_items and type_id is not None:
                result["filters"][str(type_id)] = filter_items
        return result

    def homeVideoContent(self):
        videos = []
        kjson = self.init_data
        for i in kjson.get('type_list', []):
            for item in i.get('recommend_list', []):
                vod_id = item.get('vod_id', '')
                name = item.get('vod_name', '')
                pic = item.get('vod_pic', '')
                remarks = item.get('vod_remarks', '')
                if vod_id and name:
                    video = {
                        "vod_id": vod_id,
                        "vod_name": name,
                        "vod_pic": pic,
                        "vod_remarks": remarks
                    }
                    videos.append(video)
        return {'list': videos}

    def categoryContent(self, cid, pg, filter, ext):
        videos = []
        payload = {
            'area': ext.get('area', '全部'),
            'year': ext.get('year', '全部'),
            'type_id': cid,
            'page': str(pg),
            'sort': ext.get('sort', '最新'),
            'lang': ext.get('lang', '全部'),
            'class': ext.get('class', '全部')
        }
        try:
            url = f'{self.xurl}.index/typeFilterVodList'
            res = self.post(url=url, headers=headerx, data=payload, verify=False)
            if res.status_code != 200:
                return {'list': [], 'page': pg, 'pagecount': 1, 'limit': 90, 'total': 0}
            res_data = res.json()
            encrypted_data = res_data.get('data', '')
            if not encrypted_data:
                return {'list': [], 'page': pg, 'pagecount': 1, 'limit': 90, 'total': 0}
            kjson = self.decrypt(encrypted_data)
            kjson1 = json.loads(kjson)
            for i in kjson1.get('recommend_list', []):
                id = i.get('vod_id', '')
                name = i.get('vod_name', '')
                pic = i.get('vod_pic', '')
                remarks = i.get('vod_remarks', '')
                if id and name:
                    video = {
                        "vod_id": id,
                        "vod_name": name,
                        "vod_pic": pic,
                        "vod_remarks": remarks
                    }
                    videos.append(video)
        except:
            pass
        return {'list': videos, 'page': pg, 'pagecount': 9999, 'limit': 90, 'total': 999999}

    def should_exclude_line(self, line_name):
        """检查线路是否应该被排除"""
        for pattern in self.EXCLUDE_PATTERNS:
            if re.search(pattern, line_name, re.IGNORECASE):
                return True
        return False

    def get_line_priority(self, line_name):
        """获取线路的优先级"""
        for idx, priority_pattern in enumerate(self.PRIORITY_LIST):
            if re.search(priority_pattern, line_name, re.IGNORECASE):
                return idx
        return len(self.PRIORITY_LIST)  # 默认最低优先级

    def detailContent(self, ids):
        if not ids:
            return {'list': []}
        did = ids[0]
        payload = {
            'vod_id': did,
        }
        api_endpoints = ['vodDetail', 'vodDetail2']
        kjson = None
        for endpoint in api_endpoints:
            url = f'{self.xurl}.index/{endpoint}'
            try:
                response = self.post(url=url, headers=headerx, data=payload, verify=False)
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        encrypted_data = response_data.get('data', '')
                        if encrypted_data:
                            decrypted_data = self.decrypt(encrypted_data)
                            kjson = json.loads(decrypted_data)
                            break
                    except:
                        continue
            except:
                continue
        if kjson is None:
            for category in self.init_data.get('type_list', []):
                for item in category.get('recommend_list', []):
                    if str(item.get('vod_id', '')) == did:
                        kjson = {'vod': item, 'vod_play_list': []}
                        break
                if kjson:
                    break
        if kjson is None:
            return {'list': []}
        
        # 处理线路排序和排除
        play_lines = []
        for line in kjson.get('vod_play_list', []):
            player_info = line.get('player_info', {})
            line_name = player_info.get('show', '')
            
            # 检查是否应该排除该线路
            if self.should_exclude_line(line_name):
                continue
                
            # 为线路设置优先级
            priority = self.get_line_priority(line_name)
            play_lines.append((priority, line))
        
        # 按照优先级排序线路
        play_lines.sort(key=lambda x: x[0])
        
        videos = []
        play_form = ''
        play_url = ''
        lineid = 1
        name_count = {}
        
        for priority, line in play_lines:
            player_info = line.get('player_info', {})
            player_show = player_info.get('show', f'线路{lineid}')
            
            # 处理特殊关键词
            keywords = {'防走丢', '群', '防失群', '官网'}
            if any(keyword in player_show for keyword in keywords):
                player_show = f'{lineid}线'
                player_info['show'] = player_show
                
            # 处理重名线路
            count = name_count.get(player_show, 0) + 1
            name_count[player_show] = count
            if count > 1:
                player_info['show'] = f"{player_show}{count}"
                
            play_form += player_info['show'] + '$$$'
            
            # 处理播放URL
            parse = player_info.get('parse', '')
            parse_type = player_info.get('parse_type', '0')
            player_parse_type = player_info.get('player_parse_type', '0')
            kurls = ""
            
            for vod in line.get('urls', []):
                name = vod.get('name', '集1')
                url = vod.get('url', '')
                token = vod.get('token', '')
                if not url:
                    continue
                token_str = 'token+' + token
                kurls += f"{name}${parse},{url},{token_str},{player_parse_type},{parse_type}#"
                
            kurls = kurls.rstrip('#')
            if kurls:
                play_url += kurls + '$$$'
                
            lineid += 1
            
        play_form = play_form.rstrip('$$$')
        play_url = play_url.rstrip('$$$')
        
        vod_info = kjson.get('vod', {})
        videos.append({
            "vod_id": did,
            "vod_name": vod_info.get('vod_name', '未知'),
            "vod_actor": vod_info.get('vod_actor', '').replace('演员', ''),
            "vod_director": vod_info.get('vod_director', '').replace('导演', ''),
            "vod_content": vod_info.get('vod_content', '暂无简介'),
            "vod_remarks": vod_info.get('vod_remarks', ''),
            "vod_year": vod_info.get('vod_year', '') + '年',
            "vod_area": vod_info.get('vod_area', ''),
            "vod_play_from": play_form,
            "vod_play_url": play_url
        })
        return {'list': videos}

    def playerContent(self, flag, id, vipFlags):
        if not id:
            return {"parse": 0, "url": "", "header": headerx}
        parts = id.split(',')
        uid = parts[0] if len(parts) > 0 else ''
        kurl = parts[1] if len(parts) > 1 else ''
        token = parts[2].replace('token+', '') if len(parts) > 2 else ''
        player_parse_type = parts[3] if len(parts) > 3 else '0'
        parse_type = parts[4] if len(parts) > 4 else '0'
        if parse_type == '0':
            return {"parse": 0, "url": kurl, "header": headerx}
        elif parse_type == '2':
            return {"parse": 1, "url": uid + kurl, "header": headerx}
        elif player_parse_type == '2':
            try:
                response = self.fetch(uid + kurl, headers=headerx, verify=False)
                if response.status_code == 200:
                    kjson1 = response.json()
                    return {"parse": 0, "url": kjson1.get('url', ''), "header": headerx}
            except:
                pass
            return {"parse": 1, "url": uid + kurl, "header": headerx}
        else:
            try:
                encrypted_url = self.encrypt(kurl)
                payload = {
                    'parse_api': uid,
                    'url': encrypted_url,
                    'player_parse_type': player_parse_type,
                    'token': token
                }
                url1 = f"{self.xurl}.index/vodParse"
                response = self.post(url1, headers=headerx, data=payload, verify=False)
                if response.status_code == 200:
                    response_data = response.json()
                    encrypted_data = response_data.get('data', '')
                    if encrypted_data:
                        kjson = self.decrypt(encrypted_data)
                        kjson1 = json.loads(kjson)
                        kjson2 = kjson1.get('json', '{}')
                        kjson3 = json.loads(kjson2)
                        url = kjson3.get('url', '')
                        if url:
                            return {"parse": 0, "url": url, "header": headerx}
            except:
                pass
            return {"parse": 0, "url": kurl, "header": headerx}

    def searchContent(self, key, quick, pg="1"):
        videos = []
        if 'xiaohys.com' in self.xurl:
            try:
                host = self.xurl.split('api.php')[0]
                data = self.fetch(f'{host}index.php/ajax/suggest?mid=1&wd={key}', headers=headerx).json()
                for i in data.get('list', []):
                    videos.append({
                        "vod_id": i.get('id', ''),
                        "vod_name": i.get('name', ''),
                        "vod_pic": i.get('pic', '')
                    })
            except:
                pass
        else:
            payload = {
                'keywords': key,
                'type_id': "0",
                'page': str(pg)
            }
            if self.search_verify:
                try:
                    verifi = self.verification()
                    if verifi:
                        payload['code'] = verifi['code']
                        payload['key'] = verifi['uuid']
                except:
                    pass
            try:
                url = f'{self.xurl}.index/searchList'
                res = self.post(url=url, data=payload, headers=headerx, verify=False).json()
                if not res.get('data'):
                    return {'list': videos, 'page': pg, 'pagecount': 9999, 'limit': 90, 'total': 999999}
                encrypted_data = res['data']
                kjson = self.decrypt(encrypted_data)
                kjson1 = json.loads(kjson)
                for i in kjson1.get('search_list', []):
                    id = i.get('vod_id', '')
                    name = i.get('vod_name', '')
                    pic = i.get('vod_pic', '')
                    year = i.get('vod_year', '')
                    vod_class = i.get('vod_class', '')
                    remarks = f'{year} {vod_class}' if year or vod_class else ''
                    if id and name:
                        videos.append({
                            "vod_id": id,
                            "vod_name": name,
                            "vod_pic": pic,
                            "vod_remarks": remarks
                        })
            except:
                pass
        return {'list': videos, 'page': pg, 'pagecount': 9999, 'limit': 90, 'total': 999999}

    def localProxy(self, params):
        if params['type'] == "m3u8":
            return self.proxyM3u8(params)
        elif params['type'] == "media":
            return self.proxyMedia(params)
        elif params['type'] == "ts":
            return self.proxyTs(params)
        return None

    def isVideoFormat(self, url):
        return False

    def manualVideoCheck(self):
        return False

    def decrypt(self, encrypted_data_b64):
        try:
            key_bytes = self.key.encode('utf-8')
            iv_bytes = self.iv.encode('utf-8')
            encrypted_data = base64.b64decode(encrypted_data_b64)
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes)
            decrypted_padded = cipher.decrypt(encrypted_data)
            try:
                decrypted = unpad(decrypted_padded, AES.block_size)
            except:
                decrypted = decrypted_padded
            return decrypted.decode('utf-8', errors='ignore')
        except:
            return ''

    def encrypt(self, sencrypted_data):
        try:
            key_bytes = self.key.encode('utf-8')
            iv_bytes = self.iv.encode('utf-8')
            data_bytes = sencrypted_data.encode('utf-8')
            padded_data = pad(data_bytes, AES.block_size)
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes)
            encrypted_bytes = cipher.encrypt(padded_data)
            return base64.b64encode(encrypted_bytes).decode('utf-8')
        except:
            return ''

    def ocr(self, base64img):
        try:
            return self.post("https://api.nn.ci/ocr/b64/text", data=base64img, headers=headerx, verify=False).text
        except:
            return None

    def verification(self):
        try:
            random_uuid = str(uuid.uuid4())
            dat = self.fetch(f'{self.xurl}.verify/create?key={random_uuid}', headers=headerx, verify=False).content
            base64_img = base64.b64encode(dat).decode('utf-8')
            code = self.ocr(base64_img)
            if not code:
                return None
            code = self.replace_code(code)
            if not (len(code) == 4 and code.isdigit()):
                return None
            return {'uuid': random_uuid, 'code': code}
        except:
            return None

    def replace_code(self, text):
        if not text:
            return ''
        replacements = {
            'y': '9', '口': '0', 'q': '0', 'u': '0', 'o': '0',
            '>': '1', 'd': '0', 'b': '8', '已': '2', 'D': '0', '五': '5'
        }
        if len(text) == 3:
            text = text.replace('566', '5066')
            text = text.replace('066', '1666')
        return ''.join(replacements.get(c, c) for c in text)