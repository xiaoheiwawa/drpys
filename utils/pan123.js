import axios from "axios";
import {ENV} from "./env.js";
import COOKIE from './cookieManager.js';
import {base64Decode} from "../libs_drpy/crypto-util.js";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 动态生成配置文件路径（基于当前文件所在目录）
const configPath = resolve(__dirname, '../pz/tokenm.json');

class Pan123 {
    constructor() {
        this.regex = /https:\/\/(www.123684.com|www.123865.com|www.123912.com|www.123pan.com|www.123pan.cn|www.123592.com)\/s\/([^\\/]+)/;
        this.api = 'https://www.123684.com/b/api/share/';
        this.loginUrl = 'https://login.123pan.com/api/user/sign_in';
        this.cate = '';

        // Token缓存相关
        this.tokenConfig = {
            pan123_account: '',
            pan123_password: '',
            pan123_auth: '',
            lastUpdate: 0
        };
        
        this.tokenFile = configPath;
        this.cacheExpire = 30 * 60 * 1000; // 30分钟缓存
        this.loadTokenConfig(); // 初始化加载配置
        this.setupFileWatcher(); // 设置文件监听
    }

    // 加载token配置并缓存
    loadTokenConfig() {
        try {
            const data = fs.readFileSync(this.tokenFile, 'utf8');
            const jsonData = JSON.parse(data);
            this.tokenConfig = {
                pan123_account: jsonData.pan123_account || '',
                pan123_password: jsonData.pan123_password || '',
                pan123_auth: jsonData.pan123_auth || '',
                lastUpdate: Date.now()
            };
            console.log('网盘123 Token配置已从文件加载并缓存');
        } catch (err) {
            if (err.code === 'ENOENT') {
              //  console.error('tokenm.json文件不存在。使用空配置。');
            } else if (err instanceof SyntaxError) {
              //  console.error('tokenm.json文件格式错误');
            } else {
               // console.error('加载token配置时出错:', err.message);
            }
            this.tokenConfig = {
                pan123_account: '',
                pan123_password: '',
                pan123_auth: '',
                lastUpdate: 0
            };
        }
    }

    // 设置文件监听
    setupFileWatcher() {
        try {
            fs.watch(this.tokenFile, (eventType, filename) => {
                if (eventType === 'change') {
                 //   console.log('检测到tokenm.json文件变化，重新加载配置');
                    this.loadTokenConfig();
                }
            });
           // console.log('已设置tokenm.json文件监听');
        } catch (err) {
            console.error('设置文件监听失败:', err.message);
        }
    }

    // 检查并刷新缓存
    checkAndRefreshCache() {
        if (Date.now() - this.tokenConfig.lastUpdate > this.cacheExpire) {
            console.log('网盘123 Token缓存已过期，重新加载');
            this.loadTokenConfig();
        }
    }

    // 使用 getter 定义动态属性，自动检查缓存
    get passport() {
        this.checkAndRefreshCache();
        return this.tokenConfig.pan123_account;
    }

    get password() {
        this.checkAndRefreshCache();
        return this.tokenConfig.pan123_password;
    }

    get auth() {
        this.checkAndRefreshCache();
        return this.tokenConfig.pan123_auth;
    }

    async init() {
        if (this.passport) {
            console.log("获取123云盘账号成功");
        }
        if (this.password) {
            console.log("获取123云盘密码成功");
        }
        if (this.auth) {
            try {
                const info = JSON.parse(CryptoJS.enc.Base64.parse(this.auth.split('.')[1]).toString(CryptoJS.enc.Utf8));
                if (info.exp > Math.floor(Date.now() / 1000)) {
                    console.log("登录状态有效");
                } else {
                    console.log("登录过期，重新登录");
                    await this.login();
                }
            } catch (e) {
                console.log("登录信息解析失败，重新登录");
                await this.login();
            }
        } else {
            console.log("尚未登录，开始登录");
            await this.login();
        }
    }

    async login() {
        try {
            const data = JSON.stringify({
                "passport": this.passport,
                "password": this.password,
                "remember": true
            });
            
            const config = {
                method: 'POST',
                url: this.loginUrl,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Content-Type': 'application/json',
                    'App-Version': '43',
                    'Referer': 'https://login.123pan.com/centerlogin?redirect_url=https%3A%2F%2Fwww.123684.com&source_page=website',
                },
                data: data
            };

            const response = await axios.request(config);
            if (response.data && response.data.data && response.data.data.token) {
                // 仅更新内存缓存，不写入文件
                this.tokenConfig.pan123_auth = response.data.data.token;
                this.tokenConfig.lastUpdate = Date.now();
                console.log("登录成功，token已更新");
                return true;
            } else {
                console.error("登录失败:", response.data);
                return false;
            }
        } catch (error) {
            console.error("登录过程中出错:", error);
            return false;
        }
    }

    async refreshAuth(from = '') {
        try {
            const result = await this.login();
            if (result) {
                console.log(`${from}自动更新123云盘token成功`);
            } else {
                console.log(`${from}自动更新123云盘token失败`);
            }
            return result;
        } catch (e) {
            console.error(`${from}自动更新123云盘token出错:`, e);
            return false;
        }
    }

    getShareData(url) {
        this.SharePwd = '';
        url = decodeURIComponent(url);
        
        // 处理提取码
        if (url.indexOf('提取码') > 0 && url.indexOf('?') < 0) {
            url = url.replace(/提取码:|提取码|提取码：/g, '?');
        }
        if (url.indexOf('提取码') > 0 && url.indexOf('?') > 0) {
            url = url.replace(/提取码:|提取码|提取码：|/g, '');
        }
        if (url.indexOf('：') > 0) {
            url = url.replace('：', '');
        }
        
        const matches = this.regex.exec(url);
        if (url.indexOf('?') > 0) {
            this.SharePwd = url.split('?')[1].match(/[A-Za-z0-9]+/)[0];
            console.log('提取码:', this.SharePwd);
        }
        
        if (matches) {
            if (matches[2].indexOf('?') > 0) {
                return matches[2].split('?')[0];
            } else if (matches[2].indexOf('html') > 0) {
                return matches[2].replace('.html', '');
            } else {
                return matches[2].match(/www/g) ? matches[1] : matches[2];
            }
        }
        return null;
    }

    async getFilesByShareUrl(shareKey) {
        let file = {};
        let cate = await this.getShareInfo(shareKey, this.SharePwd, 0, 0);
        
        if (cate && Array.isArray(cate)) {
            await Promise.all(cate.map(async (item) => {
                if (!(item.filename in file)) {
                    file[item.filename] = [];
                }
                const fileData = await this.getShareList(item.shareKey, item.SharePwd, item.next, item.fileId);
                if (fileData && fileData.length > 0) {
                    file[item.filename].push(...fileData);
                }
            }));
        }
        
        // 过滤掉空数组
        for (let key in file) {
            if (file[key].length === 0) {
                delete file[key];
            }
        }
        
        return file;
    }

    async getShareInfo(shareKey, SharePwd, next, ParentFileId) {
        let cate = [];
        try {
            const response = await axios.get(this.api + `get?limit=100&next=${next}&orderBy=file_name&orderDirection=asc&shareKey=${shareKey.trim()}&SharePwd=${SharePwd || ''}&ParentFileId=${ParentFileId}&Page=1`, {
                headers: {},
            });
            
            if (response.status === 200) {
                if (response.data.code === 5103) {
                    console.log(response.data.message);
                } else {
                    const info = response.data.data;
                    const nextPage = info.Next;
                    const infoList = info.InfoList;
                    
                    infoList.forEach(item => {
                        if (item.Category === 0) {
                            cate.push({
                                filename: item.FileName,
                                shareKey: shareKey,
                                SharePwd: SharePwd,
                                next: nextPage,
                                fileId: item.FileId
                            });
                        }
                    });
                    
                    if (cate.length === 0) {
                        infoList.forEach(item => {
                            if (item.Category === 2) {
                                cate.push({
                                    filename: item.FileName,
                                    shareKey: shareKey,
                                    SharePwd: SharePwd,
                                    next: nextPage,
                                    fileId: item.FileId
                                });
                            }
                        });
                    }
                    
                    const result = await Promise.all(cate.map(async (it) => this.getShareInfo(shareKey, SharePwd, nextPage, it.fileId)));
                    const filteredResult = result.filter(item => item !== undefined && item !== null);
                    return [...cate, ...filteredResult.flat()];
                }
            }
        } catch (error) {
            console.error('获取分享信息时出错:', error);
            return null;
        }
    }

    async getShareList(shareKey, SharePwd, next, ParentFileId) {
        let video = [];
        const link = this.api + `get?limit=100&next=${next}&orderBy=file_name&orderDirection=asc&shareKey=${shareKey.trim()}&SharePwd=${SharePwd || ''}&ParentFileId=${ParentFileId}&Page=1`;
        
        try {
            const response = await axios.get(link, {
                headers: {},
            });
            
            const infoList = response.data;
            
            if (infoList.data.Next === '') {
                const list = await this.getShareList(shareKey, SharePwd, 0, 0);
                list.forEach(it => {
                    video.push({
                        ShareKey: shareKey,
                        FileId: it.FileId,
                        S3KeyFlag: it.S3KeyFlag,
                        Size: it.Size,
                        Etag: it.Etag,
                        FileName: it.FileName,
                    });
                });
            }
            
            infoList.data.InfoList.forEach(it => {
                if (it.Category === 2) {
                    video.push({
                        ShareKey: shareKey,
                        FileId: it.FileId,
                        S3KeyFlag: it.S3KeyFlag,
                        Size: it.Size,
                        Etag: it.Etag,
                        FileName: it.FileName,
                    });
                }
            });
            
            return video;
        } catch (error) {
            console.error('获取分享列表时出错:', error);
            return [];
        }
    }

    async getDownload(shareKey, FileId, S3KeyFlag, Size, Etag) {
        await this.init();
        
        try {
            const data = JSON.stringify({
                "ShareKey": shareKey,
                "FileID": FileId,
                "S3KeyFlag": S3KeyFlag,
                "Size": Size,
                "Etag": Etag
            });
            
            const config = {
                method: 'POST',
                url: `${this.api}download/info`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Authorization': `Bearer ${this.auth}`,
                    'Content-Type': 'application/json;charset=UTF-8',
                    'platform': 'android',
                },
                data: data
            };
            
            const response = await axios.request(config);
            if (response.data && response.data.data && response.data.data.DownloadURL) {
                const downloadUrl = base64Decode((new URL(response.data.data.DownloadURL)).searchParams.get('params'));
                
                // 测试下载链接是否有效
                const testResult = await this.testSupport(downloadUrl, {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Authorization': `Bearer ${this.auth}`
                });
                
                if (!testResult[0]) {
                    await this.refreshAuth('getDownload');
                    return await this.getDownload(shareKey, FileId, S3KeyFlag, Size, Etag);
                }
                
                return downloadUrl;
            }
            return null;
        } catch (error) {
            console.error('获取下载链接时出错:', error);
            if (error.response && error.response.status === 401) {
                console.log('token可能已失效，尝试刷新token');
                await this.refreshAuth('getDownload');
                return await this.getDownload(shareKey, FileId, S3KeyFlag, Size, Etag);
            }
            return null;
        }
    }

    async getLiveTranscoding(shareKey, FileId, S3KeyFlag, Size, Etag) {
        await this.init();
        
        try {
            const config = {
                method: 'GET',
                url: `https://www.123684.com/b/api/video/play/info`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Authorization': `Bearer ${this.auth}`,
                    'Content-Type': 'application/json;charset=UTF-8',
                    'platform': 'android',
                },
                params: {
                    "etag": Etag,
                    "size": Size,
                    "from": "1",
                    "shareKey": shareKey
                }
            };
            
            const response = await axios.request(config);
            if (response.data && response.data.data && response.data.data.video_play_info) {
                const videoinfo = [];
                response.data.data.video_play_info.forEach(item => {
                    if (item.url !== '') {
                        videoinfo.push({
                            name: item.resolution,
                            url: item.url
                        });
                    }
                });
                return videoinfo;
            }
            return [];
        } catch (error) {
            console.error('获取直播转码信息时出错:', error);
            if (error.response && error.response.status === 401) {
                console.log('token可能已失效，尝试刷新token');
                await this.refreshAuth('getLiveTranscoding');
                return await this.getLiveTranscoding(shareKey, FileId, S3KeyFlag, Size, Etag);
            }
            return [];
        }
    }

    async testSupport(url, headers) {
        const resp = await axios.get(url, {
            responseType: 'stream',
            headers: Object.assign(
                {
                    Range: 'bytes=0-0',
                },
                headers,
            ),
        }).catch((err) => {
            console.error('[testSupport] error:', err.message);
            return err.response || { status: 500, data: {} };
        });

        if (resp && (resp.status === 206 || resp.status === 200)) {
            const isAccept = resp.headers['accept-ranges'] === 'bytes';
            const contentRange = resp.headers['content-range'];
            const contentLength = parseInt(resp.headers['content-length']);
            const isSupport = isAccept || !!contentRange || contentLength === 1 || resp.status === 200;
            const length = contentRange ? parseInt(contentRange.split('/')[1]) : contentLength;
            delete resp.headers['content-range'];
            delete resp.headers['content-length'];
            if (length) resp.headers['content-length'] = length.toString();
            return [isSupport, resp.headers];
        } else {
            console.log('[testSupport] resp.status:', resp.status);
            return [false, null];
        }
    }
}

export const Pan = new Pan123();