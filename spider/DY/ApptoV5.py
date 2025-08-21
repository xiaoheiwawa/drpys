"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'ApptoV5',
  lang: 'hipy'
})
"""

import re
import sys
import uuid
import json
from base.spider import Spider
sys.path.append('..')

class Spider(Spider):
    def __init__(self):
        self.host = ''
        self.config = {}
        self.local_uuid = str(uuid.uuid4())
        self.parsing_config = []
        self.headers = {
            'User-Agent': "Dart/2.19 (dart:io)",
            'Accept-Encoding': "gzip",
            'appto-local-uuid': self.local_uuid
        }

    def getName(self):
        return "ApptoV5"

    def init(self, extend=''):
        try:
            # First try to parse as JSON for host configuration
            try:
                js1 = json.loads(extend)
                host = js1.get('host') or js1.get('url')
                if host:
                    self.host = host.rstrip('/')
                    return self._load_config()
            except json.JSONDecodeError:
                # If not JSON, treat as direct host string
                host = extend.strip()
                if not host.startswith('http'):
                    return {}
                if not re.match(r'^https?://[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(:\d+)?/?$', host):
                    host_ = self.fetch(host).json()
                    self.host = host_['domain']
                else:
                    self.host = host
                return self._load_config()
        except Exception as e:
            print(f'初始化异常：{e}')
            return {}
        return {}

    def _load_config(self):
        """Load configuration from the host"""
        try:
            response = self.fetch(
                f'{self.host}/apptov5/v1/config/get?p=android&__platform=android',
                headers=self.headers
            ).json()
            
            self.config = response['data']
            parsing_conf = self.config['get_parsing']['lists']
            parsing_config = {}
            
            for i in parsing_conf:
                if i['config']:
                    label = [
                        j['label'] 
                        for j in i['config'] 
                        if j['type'] == 'json'
                    ]
                    if label:
                        parsing_config[i['key']] = label
            
            self.parsing_config = parsing_config
            return None
        except Exception as e:
            print(f'配置加载异常：{e}')
            return {}

    def homeContent(self, filter):
        result = {"class": []}
        try:
            home_cate = self.config.get('get_home_cate', [])
            for i in home_cate:
                if isinstance(i.get('extend', []), dict):
                    result["class"].append({
                        'type_id': i.get('cate', ''),
                        'type_name': i.get('title', '')
                    })
        except Exception as e:
            print(f'首页分类异常：{e}')
        return result

    def homeVideoContent(self):
        result = {'list': []}
        try:
            response = self.fetch(
                f'{self.host}/apptov5/v1/home/data?id=1&mold=1&__platform=android',
                headers=self.headers
            ).json()
            
            vod_list = []
            for i in response.get('data', {}).get('sections', []):
                for j in i.get('items', []):
                    vod_pic = j.get('vod_pic', '')
                    if vod_pic.startswith('mac://'):
                        vod_pic = vod_pic.replace('mac://', 'http://', 1)
                    
                    vod_list.append({
                        "vod_id": j.get('vod_id'),
                        "vod_name": j.get('vod_name'),
                        "vod_pic": vod_pic,
                        "vod_remarks": j.get('vod_remarks')
                    })
            
            result['list'] = vod_list
        except Exception as e:
            print(f'首页视频异常：{e}')
        return result

    def categoryContent(self, tid, pg, filter, extend):
        result = {'list': [], 'page': pg, 'total': 0}
        try:
            url = f"{self.host}/apptov5/v1/vod/lists"
            params = {
                'area': extend.get('area', ''),
                'lang': extend.get('lang', ''),
                'year': extend.get('year', ''),
                'order': extend.get('sort', 'time'),
                'type_id': tid,
                'type_name': '',
                'page': pg,
                'pageSize': 21,
                '__platform': 'android'
            }
            
            response = self.fetch(url, params=params, headers=self.headers).json()
            data = response.get('data', {})
            
            for item in data.get('data', []):
                if item.get('vod_pic', '').startswith('mac://'):
                    item['vod_pic'] = item['vod_pic'].replace('mac://', 'http://', 1)
            
            result.update({
                'list': data.get('data', []),
                'total': data.get('total', 0)
            })
        except Exception as e:
            print(f'分类内容异常：{e}')
        return result

    def detailContent(self, ids):
        result = {'list': []}
        if not ids:
            return result
            
        try:
            response = self.fetch(
                f"{self.host}/apptov5/v1/vod/getVod?id={ids[0]}",
                headers=self.headers
            ).json()
            
            data = response.get('data', {})
            vod_play_url = ''
            vod_play_from = ''
            
            for i in data.get('vod_play_list', []):
                play_url = '#'.join([
                    f"{j.get('name', '')}${i.get('player_info', {}).get('from', '')}@{j.get('url', '')}"
                    for j in i.get('urls', [])
                ])
                
                vod_play_from += i.get('player_info', {}).get('show', '') + '$$$'
                vod_play_url += play_url + '$$$'
            
            result['list'].append({
                'vod_id': data.get('vod_id'),
                'vod_name': data.get('vod_name'),
                'vod_content': data.get('vod_content'),
                'vod_remarks': data.get('vod_remarks'),
                'vod_director': data.get('vod_director'),
                'vod_actor': data.get('vod_actor'),
                'vod_year': data.get('vod_year'),
                'vod_area': data.get('vod_area'),
                'vod_play_from': vod_play_from.rstrip('$$$'),
                'vod_play_url': vod_play_url.rstrip('$$$')
            })
        except Exception as e:
            print(f'详情内容异常：{e}')
        return result

    def searchContent(self, key, quick, pg='1'):
        result = {'list': [], 'page': pg, 'total': 0}
        try:
            response = self.fetch(
                f"{self.host}/apptov5/v1/search/lists?wd={key}&page={pg}&type=&__platform=android",
                headers=self.headers
            ).json()
            
            data = response.get('data', {}).get('data', [])
            for item in data:
                if item.get('vod_pic', '').startswith('mac://'):
                    item['vod_pic'] = item['vod_pic'].replace('mac://', 'http://', 1)
            
            result.update({
                'list': data,
                'total': response.get('data', {}).get('total', 0)
            })
        except Exception as e:
            print(f'搜索异常：{e}')
        return result

    def playerContent(self, flag, id, vipflags):
        default_ua = ('Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) '
                     'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 '
                     'Mobile/15E148 Safari/604.1')
        
        result = {
            'parse': 0,
            'url': id,
            'header': {'User-Agent': default_ua}
        }
        
        if not id or '@' not in id:
            return result
            
        try:
            playfrom, rawurl = id.split('@', 1)
            label_list = self.parsing_config.get(playfrom, [])
            
            if not label_list:
                return result
                
            for label in label_list:
                try:
                    payload = {
                        'play_url': rawurl,
                        'label': label,
                        'key': playfrom
                    }
                    
                    response = self.post(
                        f"{self.host}/apptov5/v1/parsing/proxy?__platform=android",
                        data=payload,
                        headers=self.headers
                    ).json()
                    
                    if not isinstance(response, dict) or response.get('code') == 422:
                        continue
                        
                    data = response.get('data', {})
                    url = data.get('url')
                    if not url:
                        continue
                        
                    ua = data.get('UA') or data.get('UserAgent') or default_ua
                    return {
                        'parse': 0,
                        'url': url,
                        'header': {'User-Agent': ua}
                    }
                except Exception as e:
                    print(f"解析请求异常: {e}")
                    continue
        except Exception as e:
            print(f'播放器内容异常：{e}')
            
        return result

    def isVideoFormat(self, url):
        return False

    def manualVideoCheck(self):
        return False

    def localProxy(self, param):
        return None

    def destroy(self):
        pass