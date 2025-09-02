import '../libs_drpy/jsencrypt.js';
import {ENV} from "./env.js";
import COOKIE from './cookieManager.js';
import axios from "axios";
import qs from "qs";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 动态生成配置文件路径（基于当前文件所在目录）
const configPath = resolve(__dirname, '../pz/tokenm.json');

class CloudDrive {
    constructor() {
        this.regex = /https:\/\/cloud\.189\.cn\/web\/share\?code=([^&]+)/;
        this.config = {
            clientId: '538135150693412',
            model: 'KB2000',
            version: '9.0.6',
            pubKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZLyV4gHNDUGJMZoOcYauxmNEsKrc0TlLeBEVVIIQNzG4WqjimceOj5R9ETwDeeSN3yejAKLGHgx83lyy2wBjvnbfm/nLObyWwQD/09CmpZdxoFYCH6rdDjRpwZOZ2nXSZpgkZXoOBkfNXNxnN74aXtho2dqBynTw3NFTWyQl8BQIDAQAB',
        };
        this.headers = {
            'User-Agent': `Mozilla/5.0 (Linux; U; Android 11; ${this.config.model} Build/RP1A.201005.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36 Ecloud/${this.config.version} Android/30 clientId/${this.config.clientId} clientModel/${this.config.model} clientChannelId/qq proVersion/1.0.6`,
            'Referer': 'https://m.cloud.189.cn/zhuanti/2016/sign/index.jsp?albumBackupOpened=1',
            'Accept-Encoding': 'gzip, deflate',
        };
        this.api = 'https://cloud.189.cn/api';
        this.shareCode = '';
        this.accessCode = '';
        this.shareId = '';
        this.shareMode = '';
        this.isFolder = '';
        this.index = 0;

        // Token缓存相关
        this.tokenConfig = {
            ty_cookie: '',
            ty_account: '',
            ty_password: '',
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
                ty_cookie: jsonData.ty_cookie || '',
                ty_account: jsonData.ty_account || '',
                ty_password: jsonData.ty_password || '',
                lastUpdate: Date.now()
            };
          //  console.log('Token配置已从文件加载并缓存');
        } catch (err) {
            if (err.code === 'ENOENT') {
               // console.error('tokenm.json文件不存在。使用空配置。');
            } else if (err instanceof SyntaxError) {
               // console.error('tokenm.json文件格式错误');
            } else {
               // console.error('加载token配置时出错:', err.message);
            }
            this.tokenConfig = {
                ty_cookie: '',
                ty_account: '',
                ty_password: '',
                lastUpdate: 0
            };
        }
    }

    // 设置文件监听
    setupFileWatcher() {
        try {
            fs.watch(this.tokenFile, (eventType, filename) => {
                if (eventType === 'change') {
                    console.log('检测到tokenm.json文件变化，重新加载配置');
                    this.loadTokenConfig();
                }
            });
        //    console.log('已设置tokenm.json文件监听');
        } catch (err) {
           // console.error('设置文件监听失败:', err.message);
        }
    }

    // 检查并刷新缓存
    checkAndRefreshCache() {
        if (Date.now() - this.tokenConfig.lastUpdate > this.cacheExpire) {
            console.log('天翼 Token缓存已过期，重新加载');
            this.loadTokenConfig();
        }
    }

    // 使用 getter 定义动态属性，自动检查缓存
    get cookie() {
        this.checkAndRefreshCache();
        return this.tokenConfig.ty_cookie;
    }

    get account() {
        this.checkAndRefreshCache();
        return this.tokenConfig.ty_account;
    }

    get password() {
        this.checkAndRefreshCache();
        return this.tokenConfig.ty_password;
    }

    // 初始化方法，加载本地配置
    async init() {
        if (this.account) {
            console.log('天翼账号获取成功');
        }
        if (this.password) {
            console.log('天翼密码获取成功');
        }
        if (this.cookie) {
            console.log('天翼cookie获取成功');
        } else if (this.account && this.password) {
            console.log('正在自动登录...');
            await this.login(this.account, this.password);
        }
    }

    async login(uname, passwd) {
        try {
            let resp = await axios.post('https://open.e.189.cn/api/logbox/config/encryptConf.do?appId=cloud');
            let pubKey = resp.data.data.pubKey;
            resp = await axios.get('https://cloud.189.cn/api/portal/loginUrl.action?redirectURL=https://cloud.189.cn/web/redirect.html?returnURL=/main.action');
            
            // 获取最后请求url中的参数reqId和lt
            let Reqid = resp.request.path.match(/reqId=(\w+)/)[1];
            let Lt = resp.request.path.match(/lt=(\w+)/)[1];
            let tHeaders = {
                "Content-Type": "application/x-www-form-urlencoded",
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/76.0',
                'Referer': 'https://open.e.189.cn/', 
                Lt, 
                Reqid,
            };
            
            let data = { version: '2.0', appKey: 'cloud' };
            resp = await axios.post('https://open.e.189.cn/api/logbox/oauth2/appConf.do', qs.stringify(data), { headers: tHeaders });
            
            let returnUrl = resp.data.data.returnUrl;
            let paramId = resp.data.data.paramId;
            const keyData = `-----BEGIN PUBLIC KEY-----\n${pubKey}\n-----END PUBLIC KEY-----`;
            const jsencrypt = new JSEncrypt();
            jsencrypt.setPublicKey(keyData);
            const enUname = Buffer.from(jsencrypt.encrypt(uname), 'base64').toString('hex');
            const enPasswd = Buffer.from(jsencrypt.encrypt(passwd), 'base64').toString('hex');
            
            data = {
                appKey: 'cloud',
                version: '2.0',
                accountType: '01',
                mailSuffix: '@189.cn',
                validateCode: '',
                returnUrl,
                paramId,
                captchaToken: '',
                dynamicCheck: 'FALSE',
                clientType: '1',
                cb_SaveName: '0',
                isOauth2: false,
                userName: `{NRP}${enUname}`,
                password: `{NRP}${enPasswd}`,
            };
            
            resp = await axios.post('https://open.e.189.cn/api/logbox/oauth2/loginSubmit.do', qs.stringify(data), { headers: tHeaders, validateStatus: null });
            
            if (resp.data.toUrl) {
                let cookies = resp.headers['set-cookie'].map(it => it.split(';')[0]).join(';');
                resp = await axios.get(resp.data.toUrl, { 
                    headers: { ...this.headers, Cookie: cookies }, 
                    maxRedirects: 0, 
                    validateStatus: null 
                });
                
                cookies += '; ' + resp.headers['set-cookie'].map(it => it.split(';')[0]).join(';');
                // 仅更新内存缓存，不写入文件
                this.tokenConfig.ty_cookie = cookies;
                this.tokenConfig.lastUpdate = Date.now();
                console.log('登录成功，cookie已更新');
            } else {
                console.error('登录失败:', resp.data);
            }
        } catch (error) {
            console.error('登录过程中出错:', error);
        }
    }

    async refreshCloudCookie(from = '') {
        const nowCookie = this.cookie;
        const cookieSelfRes = await axios({
            url: "https://cloud.189.cn/",
            method: "GET",
            headers: {
                "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                Cookie: nowCookie
            }
        });
        const cookieResDataSelf = cookieSelfRes.headers;
        const resCookie = cookieResDataSelf['set-cookie'];
        if (!resCookie) {
            console.log(`${from}自动更新天翼云 cookie: 没返回新的cookie`);
            return;
        }
        const cookieObject = COOKIE.parse(resCookie);
        if (cookieObject.CLOUDID) {
            const newCookie = COOKIE.stringify({
                CLOUDID: cookieObject.CLOUDID,
                COOKIE_LOGIN_USER: cookieObject.COOKIE_LOGIN_USER || ''
            });
            console.log(`${from}自动更新天翼云 cookie: ${newCookie}`);
            // 仅更新内存缓存，不写入文件
            this.tokenConfig.ty_cookie = newCookie;
            this.tokenConfig.lastUpdate = Date.now();
        }
    }

    async getShareID(url, accessCode) {
        const matches = this.regex.exec(url);
        if (matches && matches[1]) {
            this.shareCode = matches[1];
            const accessCodeMatch = this.shareCode.match(/访问码：([a-zA-Z0-9]+)/);
            this.accessCode = accessCodeMatch ? accessCodeMatch[1] : '';
        } else {
            const matches_ = url.match(/https:\/\/cloud\.189\.cn\/t\/([^&]+)/);
            this.shareCode = matches_ ? matches_[1] : null;
            const accessCodeMatch = this.shareCode.match(/访问码：([a-zA-Z0-9]+)/);
            this.accessCode = accessCodeMatch ? accessCodeMatch[1] : '';
        }
        if (accessCode) {
            this.accessCode = accessCode;
        }
    }

    async getShareData(shareUrl, accessCode) {
        let file = {};
        let fileData = [];
        let fileId = await this.getShareInfo(shareUrl, accessCode);
        
        if (fileId) {
            let fileList = await this.getShareList(fileId);
            if (fileList && Array.isArray(fileList)) {
                await Promise.all(fileList.map(async (item) => {
                    if (!(item.name in file)) {
                        file[item.name] = [];
                    }
                    let fileData = await this.getShareFile(item.id);
                    if (fileData && fileData.length > 0) {
                        file[item.name].push(...fileData);
                    }
                }));
            } else {
                file['root'] = await this.getShareFile(fileId);
            }
        }
        
        // 过滤掉空数组
        for (let key in file) {
            if (file[key].length === 0) {
                delete file[key];
            }
        }
        
        // 如果 file 对象为空，重新获取 root 数据并过滤空数组
        if (Object.keys(file).length === 0) {
            file['root'] = await this.getShareFile(fileId);
            if (file['root'] && Array.isArray(file['root'])) {
                file['root'] = file['root'].filter(item => item && Object.keys(item).length > 0);
            }
        }
        
        return file;
    }

    extractNumber(name) {
        const match = name.match(/- (\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }

    async getShareInfo(shareUrl, accessCode) {
        if (shareUrl.startsWith('http')) {
            await this.getShareID(shareUrl, accessCode);
        } else {
            this.shareCode = shareUrl;
        }
        
        try {
            if (accessCode) {
                let check = await axios.get(`${this.api}/open/share/checkAccessCode.action?shareCode=${this.shareCode}&accessCode=${this.accessCode}`, {
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'accept': 'application/json;charset=UTF-8',
                        'accept-encoding': 'gzip, deflate, br, zstd',
                        'accept-language': 'zh-CN,zh;q=0.9',
                    }
                });
                
                if (check.status === 200) {
                    this.shareId = check.data.shareId;
                }
                
                let resp = await axios.get(`${this.api}/open/share/getShareInfoByCodeV2.action?key=noCache&shareCode=${this.shareCode}`, {
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'accept': 'application/json;charset=UTF-8',
                        'accept-encoding': 'gzip, deflate, br, zstd',
                        'accept-language': 'zh-CN,zh;q=0.9',
                    }
                });
                
                let fileId = resp.data.fileId;
                this.shareMode = resp.data.shareMode;
                this.isFolder = resp.data.isFolder;
                return fileId;
            } else {
                let resp = await axios.get(`${this.api}/open/share/getShareInfoByCodeV2.action?key=noCache&shareCode=${this.shareCode}`, {
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'accept': 'application/json;charset=UTF-8',
                        'accept-encoding': 'gzip, deflate, br, zstd',
                        'accept-language': 'zh-CN,zh;q=0.9',
                    }
                });
                
                let fileId = resp.data.fileId;
                this.shareId = resp.data.shareId;
                this.shareMode = resp.data.shareMode;
                this.isFolder = resp.data.isFolder;
                return fileId;
            }
        } catch (error) {
            console.error('获取分享信息时出错:', error);
            return null;
        }
    }

    async getShareList(fileId) {
        try {
            let videos = [];
            const headers = new Headers();
            headers.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
            headers.append('Accept', 'application/json;charset=UTF-8');
            headers.append('Accept-Encoding', 'gzip, deflate, br, zstd');
            
            const options = {
                method: 'GET',
                headers: headers
            };
            
            let resp = await _fetch(`${this.api}/open/share/listShareDir.action?key=noCache&pageNum=1&pageSize=120&fileId=${fileId}&shareDirFileId=${fileId}&isFolder=${this.isFolder}&shareId=${this.shareId}&shareMode=${this.shareMode}&iconOption=5&orderBy=filename&descending=false&accessCode=${this.accessCode}&noCache=${Math.random()}`, options);
            let json = JsonBig.parse(await resp.text());
            const data = json?.fileListAO;
            let folderList = data?.folderList;
            
            if (!folderList) {
                return null;
            }
            
            let names = folderList.map(item => item.name);
            let ids = folderList.map(item => item.id);
            
            if (folderList && folderList.length > 0) {
                names.forEach((name, index) => {
                    videos.push({
                        name: name,
                        id: ids[index],
                        type: 'folder'
                    });
                });
                
                let result = await Promise.all(ids.map(async (id) => this.getShareList(id)));
                result = result.filter(item => item !== undefined && item !== null);
                return [...videos, ...result.flat()];
            }
        } catch (e) {
            console.error('获取分享列表时出错:', e);
            return null;
        }
    }

    async getShareFile(fileId) {
        try {
            const headers = new Headers();
            headers.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
            headers.append('Accept', 'application/json;charset=UTF-8');
            headers.append('Accept-Encoding', 'gzip, deflate, br, zstd');
            
            const options = {
                method: 'GET',
                headers: headers
            };
            
            let resp = await _fetch(`${this.api}/open/share/listShareDir.action?key=noCache&pageNum=1&pageSize=120&fileId=${fileId}&shareDirFileId=${fileId}&isFolder=${this.isFolder}&shareId=${this.shareId}&shareMode=${this.shareMode}&iconOption=5&orderBy=filename&descending=false&accessCode=${this.accessCode}&noCache=${Math.random()}`, options);
            let json = JsonBig.parse(await resp.text());
            let videos = [];
            const data = json?.fileListAO;
            let fileList = data?.fileList;
            
            if (!fileList) {
                return null;
            }
            
            let filename = fileList.map(item => item.name);
            let ids = fileList.map(item => item.id);
            let count = data.fileListSize;
            
            if (count >= 0) {
                for (let i = 0; i < count; i++) {
                    if (fileList[i].mediaType === 3) {
                        videos.push({
                            name: filename[i],
                            fileId: ids[i],
                            shareId: this.shareId,
                        });
                    }
                }
            }
            
            return videos;
        } catch (e) {
            console.error('获取分享文件时出错:', e);
            return null;
        }
    }

    async getShareUrl(fileId, shareId) {
        let headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'application/json;charset=UTF-8',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
        };
        
        if (!this.cookie && this.account && this.password && this.index < 2) {
            console.log("正在登录，请稍等...");
            await this.login(this.account, this.password);
            console.log("登录成功，获取cookie成功");
        }
        
        headers['Cookie'] = this.cookie;
        
        try {
            let resp = await axios.get(`${this.api}/portal/getNewVlcVideoPlayUrl.action?shareId=${shareId}&dt=1&fileId=${fileId}&type=4&key=noCache`, {
                headers: headers
            });

            let location = await axios.get(resp.data.normal.url, {
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status >= 200 && status < 400;
                }
            });
            
            let link = '';
            if (location.status >= 300 && location.status < 400 && location.headers.location) {
                link = location.headers.location;
            } else {
                link = resp.data.normal.url;
            }
            
            // 测试链接是否有效
            const test_result = await this.testSupport(link, {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Cookie': this.cookie
            });
            
            if (!test_result[0]) {
                try {
                    await this.refreshCloudCookie('getShareUrl');
                } catch (e) {
                    console.log(`getShareUrl:自动刷新天翼云cookie失败:${e.message}`);
                }
            }
            
            return link;
        } catch (error) {
            if (error.response && error.response.status === 400 && this.index < 2) {
                console.log("获取播放地址失败，错误信息为：" + error.response.data);
                console.log('cookie失效，正在重新获取cookie');
                this.tokenConfig.ty_cookie = '';
                this.tokenConfig.lastUpdate = Date.now();
                this.index += 1;
                return await this.getShareUrl(fileId, shareId);
            } else {
                console.error('获取分享URL时出错:', error.message, error.response ? error.response.status : 'N/A');
                return null;
            }
        } finally {
            if (this.index >= 2) {
                this.index = 0;
            }
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

export const Cloud = new CloudDrive();