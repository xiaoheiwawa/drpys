# -*- coding: utf-8 -*-
# @Author  : AI Assistant
# @Time    : 2025/11/25
# 爬虫名称: NbaLuxiangBa
# 目标网站: https://www.tiyuhu.com/

import re
import sys
import requests
# 确保 base.spider 路径正确，这是 drpys 系统的标准依赖
sys.path.append('..')
from base.spider import Spider

class Spider(Spider):
    def getName(self):
        # 爬虫名称
        return "NbaLuxiangBa" 

    def init(self, extend):
        # 目标网站的域名
        self.home_url = 'https://www.tiyuhu.com'
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        }
    
    # ==================== 修复抽象方法错误所需（必须实现） ====================

    def isVideoFormat(self, url):
        # 默认不处理视频格式，交由播放器处理
        return False

    def manualVideoCheck(self):
        # 默认不需要手动视频检查
        return False
        
    def localProxy(self, params):
        # 默认不开启本地代理/转发
        return None 

    # ==================== 核心功能：分类和主页 ====================

    def homeContent(self, filter):
        # 定义主页分类：根据网站导航栏设定
        return {'class': [
            {'type_id': 'nbalx', 'type_name': 'NBA录像'},
            {'type_id': 'nbasp', 'type_name': 'NBA视频'},
            {'type_id': 'cbalx', 'type_name': 'CBA录像'},
            {'type_id': 'zqlx', 'type_name': '足球录像'},
            {'type_id': 'zqjj', 'type_name': '足球集锦'}
        ]}

    def homeVideoContent(self):
        # 获取主页“NBA录像”部分的内容，调用分类列表的第一页
        return self.categoryContent('nbalx', '1', False, None)


    def categoryContent(self, cid, page, filter, ext):
        # 获取分类页视频列表
        data = []
        if int(page) == 1:
            url = f'{self.home_url}/{cid}/'
        else:
            # 网站的分页链接格式为 /nbalx/2/
            url = f'{self.home_url}/{cid}/{page}/'
            
        try:
            res = requests.get(url, headers=self.headers)
            res.encoding = 'utf-8'
            if res.status_code != 200:
                return {'list': []}
                
            # 使用正则表达式匹配所有的文章块 <article class="blog">
            # 匹配目标：链接(1)，标题(2)，日期(3)
            pattern = re.compile(r'<article class="blog">.*?<h2><a target="_blank" href="([^"]+)" title="([^"]+)">[^<]+</a></h2>.*?<time pubdate="[^"]+">([^<]+)</time>', re.DOTALL)
            matches = pattern.findall(res.text)

            for link, title, date in matches:
                # vod_id 使用完整的 /post/XXXXX.html 路径，以便在详情页使用
                vod_id = link
                
                data.append(
                    {
                        'vod_id': vod_id,
                        'vod_name': title.strip(),
                        'vod_pic': '', # 网站列表无图
                        'vod_remarks': f"日期：{date.split(' ')[0]}", 
                    }
                )
        except Exception as e:
            print(f"Error fetching category content: {e}")
            
        # 这里的 pagecount 和 total 是估算值，用于让播放器显示分页控制
        return {'list': data, 'page': int(page), 'pagecount': 113, 'limit': 20, 'total': 2260}


    # ==================== 核心功能：详情和播放 ====================

    def detailContent(self, did):
        # did 是 categoryContent 中设置的 vod_id，即 /post/XXXXX.html
        detail_path = did[0]
        url = self.home_url + detail_path
        
        try:
            res = requests.get(url, headers=self.headers)
            res.encoding = 'utf-8' # 设置正确的编码
            if res.status_code != 200:
                return []

            # 提取视频标题
            title_match = re.search(r'<h1 class="title">([^<]+)</h1>', res.text)
            vod_name = title_match.group(1).strip() if title_match else detail_path

            # 提取描述/备注信息（从 meta description 提取）
            desc_match = re.search(r'<meta name="description" content="([^"]+)"', res.text)
            vod_content = desc_match.group(1) if desc_match else vod_name
            
            # --- 核心解析：提取播放源和链接 ---
            # 找到整个文章内容块 <div class="entry">
            entry_match = re.search(r'<div class="entry">(.*?)</div>\s*<div class="postTags">', res.text, re.DOTALL)
            if not entry_match:
                return []
            entry_html = entry_match.group(1)

            # 匹配所有 H2 标题及其后续的链接块
            # Pattern: <h2>(Source Name)</h2>(Links Block)
            # 使用非贪婪匹配 .*?
            source_blocks = re.findall(r'<h2>([^<]+)</h2>\s*(.*?)(?=<h2>|<div class="postnavi"|<div id="commentslist")', entry_html, re.DOTALL)

            play_from_list = [] # 用于存储播放源名称 (e.g., '腾讯国语 (QQ原声)')
            play_url_list = []  # 用于存储剧集链接 (e.g., '名称$链接#名称$链接')
            
            # 正则表达式用于提取链接和名称
            link_pattern = re.compile(r'<a href="([^"]+)" target="_blank">([^<]+)</a>')
            
            for source_name, links_html in source_blocks:
                source_name = source_name.strip()
                if not source_name:
                    continue
                    
                episodes = []
                link_matches = link_pattern.findall(links_html)
                
                for link_url, link_name in link_matches:
                    # 格式： 剧集名称$播放链接
                    # link_url 即腾讯视频 URL，它将被传递给 playerContent
                    episodes.append(f'{link_name.strip()}${link_url.strip()}')

                if episodes:
                    play_from_list.append(source_name)
                    # 剧集之间用 # 分隔
                    play_url_list.append('#'.join(episodes))

            # 构造 drpys 详情页数据结构
            data = {
                'type_name': 'NBA录像', 
                'vod_id': detail_path,
                'vod_name': vod_name,
                'vod_remarks': '录像源已解析',
                'vod_content': vod_content,
                
                # 播放源名称用 $$ 分隔
                'vod_play_from': '$$'.join(play_from_list), 
                # 剧集列表用 $$ 分隔，对应上面的播放源名称
                'vod_play_url': '$$'.join(play_url_list), 
            }
            return [data]

        except Exception as e:
            print(f"Error fetching detail content: {e}")
        return []

    def playerContent(self, flag, pid, vipFlags):
        # pid 即为 detailContent 中提取到的腾讯视频 URL
        final_url = pid
        
        # 腾讯视频的链接是外部链接，设置 parse=1 来触发 drpys 的内置嗅探器/解析器，
        # 自动解析出真实的 M3U8/MP4 播放地址。
        return {
            "url": final_url, 
            "header": self.headers, 
            "parse": 1, # 触发内置解析
            "jx": 0     # 不使用第三方解析
        }

    # ==================== 搜索功能 ====================

    def searchContent(self, key, quick, page='1'):
        # 搜索功能实现
        if int(page) > 1:
            return {'list': []}
        
        # 构建网站的搜索 URL
        search_url = self.home_url + f'/zb_system/cmd.php?act=search&q={requests.utils.quote(key)}'
        
        data = []
        try:
            res = requests.get(search_url, headers=self.headers)
            res.encoding = 'utf-8'
            if res.status_code != 200:
                return {'list': []}
                
            # 搜索结果页列表项的匹配模式（假设与分类页相同）
            pattern = re.compile(r'<article class="blog">.*?<h2><a target="_blank" href="([^"]+)" title="([^"]+)">[^<]+</a></h2>.*?<time pubdate="[^"]+">([^<]+)</time>', re.DOTALL)
            matches = pattern.findall(res.text)

            for link, title, date in matches:
                vod_id = link
                
                data.append(
                    {
                        'vod_id': vod_id,
                        'vod_name': title.strip(),
                        'vod_pic': '', 
                        'vod_remarks': f"日期：{date.split(' ')[0]}", 
                    }
                )
        except Exception as e:
            print(f"Error fetching search content: {e}")
            
        return {'list': data, 'page': 1, 'pagecount': 1, 'limit': 20, 'total': len(data)}

# -----------------
if __name__ == '__main__':
    # 调试代码，保持留空或自行添加测试逻辑
    pass