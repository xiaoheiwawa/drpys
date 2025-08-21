"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '首页',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
# by @嗷呜

import re
import sys
import json
import urllib3
sys.path.append('..')
from base.spider import Spider
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class Spider(Spider):
    def __init__(self):
        self.host = ''
        self.headers = {
            'User-Agent': 'okhttp/4.12.0',
        }

    def getName(self):
        return "首页"

    def init(self, extend):
        try:
            js1 = json.loads(extend)
            host = js1.get('host') or js1.get('url')
            if host:
                self.host = host.rstrip('/')
        except:
            pass

    def homeContent(self, filter):
        result = {"class": [], "filters": {}}
        try:
            if self.host.endswith('v1.vod'):
                data = self.fetch(f"{self.host}/types", headers=self.headers, verify=False).json()
                data = data['data']
            else:
                data = self.fetch(f"{self.host}/nav?token=", headers=self.headers, verify=False).json()
            
            keys = ["class", "area", "lang", "year", "letter", "by", "sort"]
            filters = {}
            classes = []
            
            for item in data.get('list', data.get('data', [])):
                jsontype_extend = item.get("type_extend", {})
                classes.append({
                    "type_name": item.get("type_name", ""),
                    "type_id": item.get("type_id", "")
                })
                
                has_non_empty_field = any(
                    key in jsontype_extend and jsontype_extend[key].strip() != ""
                    for key in keys
                )
                
                if has_non_empty_field:
                    type_id = str(item.get("type_id", ""))
                    filters[type_id] = []
                    
                    for dkey in jsontype_extend:
                        if dkey in keys and jsontype_extend[dkey].strip() != "":
                            values = jsontype_extend[dkey].split(",")
                            value_array = [
                                {"n": value.strip(), "v": value.strip()}
                                for value in values if value.strip() != ""
                            ]
                            filters[type_id].append({
                                "key": dkey,
                                "name": dkey,
                                "value": value_array
                            })
            
            result = {"class": classes, "filters": filters}
        except:
            pass
        
        return result

    def homeVideoContent(self):
        videos = []
        try:
            if self.host.endswith('v1.vod'):
                data = self.fetch(f"{self.host}/vodPhbAll", headers=self.headers, verify=False).json()
                data = data['data']
                for item in data.get('list', []):
                    videos.extend(item.get('vod_list', []))
            else:
                data = self.fetch(f"{self.host}/index_video?token=", headers=self.headers, verify=False).json()
                if 'list' in data:
                    for item in data['list']:
                        videos.extend(item.get('vlist', []))
                elif 'data' in data:
                    for item in data['data']:
                        videos.extend(item.get('vlist', []))
        except:
            pass
        
        return {'list': videos}

    def categoryContent(self, tid, pg, filter, extend):
        result = {'list': []}
        try:
            if self.host.endswith('v1.vod'):
                url = f"{self.host}?type={tid}&class={extend.get('class', '')}"
                url += f"&lang={extend.get('lang', '')}&area={extend.get('area', '')}"
                url += f"&year={extend.get('year', '')}&by=&page={pg}&limit=9"
                data = self.fetch(url, headers=self.headers, verify=False).json()
                result = {'list': data.get('data', {}).get('list', [])}
            else:
                params = {
                    'tid': tid,
                    'class': extend.get('class', ''),
                    'area': extend.get('area', ''),
                    'lang': extend.get('lang', ''),
                    'year': extend.get('year', ''),
                    'limit': '18',
                    'pg': pg
                }
                data = self.fetch(f"{self.host}/video", params=params, headers=self.headers, verify=False).json()
                result = {'list': data.get('data', [])}
        except:
            pass
        
        return result

    def detailContent(self, ids):
        result = {'list': []}
        if not ids:
            return result
            
        try:
            if self.host.endswith('v1.vod'):
                data = self.fetch(f"{self.host}/detail?vod_id={ids[0]}&rel_limit=10", 
                                headers=self.headers, verify=False).json()
            else:
                data = self.fetch(f"{self.host}/video_detail?id={ids[0]}", 
                                headers=self.headers, verify=False).json()
            
            data = data.get('data', {})
            vod_info = data.get('vod_info', data)
            
            show = ''
            vod_play_url = ''
            
            # Process vod_url_with_player if exists
            if 'vod_url_with_player' in vod_info:
                for i in vod_info['vod_url_with_player']:
                    show += i.get('name', '') + '$$$'
                    parse_api = i.get('parse_api', '')
                    url = i.get('url', '')
                    
                    if parse_api and parse_api.startswith('http') and url:
                        url2 = '#'.join([part + '@' + parse_api for part in url.split('#')])
                        vod_play_url += url2 + '$$$'
                    else:
                        vod_play_url += url + '$$$'
                
                vod_info.pop('vod_url_with_player', None)
            
            # Process vod_play_list if exists
            if 'vod_play_list' in vod_info:
                for i in vod_info['vod_play_list']:
                    player_info = i.get('player_info', {})
                    show += f"{player_info.get('show', '')}({i.get('from', '')})$$$"
                    
                    parse = player_info.get('parse', '')
                    parse2 = player_info.get('parse2', '')
                    parses = []
                    
                    if parse.startswith('http'):
                        parses.append(parse)
                    if parse2.startswith('http') and parse2 != parse:
                        parses.append(parse2)
                    
                    url_parts = []
                    for j in i.get('urls', []):
                        name = j.get('name', '')
                        j_url = j.get('url', '')
                        
                        if parses:
                            url_parts.append(f"{name}${j_url}@{','.join(parses)}")
                        else:
                            url_parts.append(f"{name}${j_url}")
                    
                    vod_play_url += '#'.join(url_parts) + '$$$'
                
                vod_info.pop('vod_play_list', None)
            
            # Remove unnecessary fields
            for field in ['rel_vods', 'type']:
                vod_info.pop(field, None)
            
            # Add processed fields
            vod_info['vod_play_from'] = show.rstrip('$$$')
            vod_info['vod_play_url'] = vod_play_url.rstrip('$$$')
            
            result = {'list': [vod_info]}
        except:
            pass
        
        return result

    def searchContent(self, key, quick, pg="1"):
        result = {'list': [], 'page': pg}
        try:
            if self.host.endswith('v1.vod'):
                data = self.fetch(f"{self.host}?page={pg}&limit=10&wd={key}", 
                                headers=self.headers, verify=False).json()
            else:
                data = self.fetch(f"{self.host}/search?text={key}&pg={pg}", 
                                headers=self.headers, verify=False).json()
            
            data_list = data.get('list', data.get('data', []))
            for item in data_list:
                if isinstance(item, dict):
                    item.pop('type', None)
            
            result = {'list': data_list, 'page': pg}
        except:
            pass
        
        return result

    def playerContent(self, flag, id, vipFlags):
        result = {
            'jx': 0,
            'parse': 0,
            'url': '',
            'header': {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'}
        }
        
        if not id:
            return result
        
        video_pattern = re.compile(r'https?:\/\/.*\.(?:m3u8|mp4|flv)')
        
        try:
            if '@' in id:
                rawurl, jxapi = id.split('@', 1)
                jxapis = jxapi.split(',') if ',' in jxapi else [jxapi]
                
                for jxapi_ in jxapis:
                    try:
                        res = self.fetch(f"{jxapi_}{rawurl}", headers=self.headers, 
                                       timeout=10, verify=False).json()
                        url = res.get('url', '')
                        if url.startswith('http'):
                            result['url'] = url
                            jxua = res.get('ua')
                            if jxua:
                                result['header']['User-Agent'] = jxua
                            break
                    except:
                        continue
                
                if not result['url']:
                    result['url'] = rawurl
                    result['jx'] = 0 if video_pattern.match(rawurl) else 1
            else:
                result['url'] = id
                result['jx'] = 0 if video_pattern.match(id) else 1
            
            if result['url'].startswith('NBY'):
                result['url'] = ''
        except:
            pass
        
        return result

    def isVideoFormat(self, url):
        return False

    def manualVideoCheck(self):
        return False

    def localProxy(self, param):
        return None

    def destroy(self):
        pass