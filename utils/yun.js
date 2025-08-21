import axios from "axios";
import CryptoJS from "crypto-js";
import {ENV} from "./env.js";
import COOKIE from './cookieManager.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 动态生成配置文件路径（基于当前文件所在目录）
const configPath = resolve(__dirname, '../pz/tokenm.json');

class YunDrive {
    constructor() {
        this.regex = /https:\/\/yun.139.com\/shareweb\/#\/w\/i\/([^&]+)/;
        this.x = CryptoJS.enc.Utf8.parse("PVGDwmcvfs1uV3d1");
        this.baseUrl = 'https://share-kd-njs.yun.139.com/yun-share/richlifeApp/devapp/IOutLink/';
        this.baseHeader = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'hcy-cool-flag': '1',
            'x-deviceinfo': '||3|12.27.0|chrome|131.0.0.0|5c7c68368f048245e1ce47f1c0f8f2d0||windows 10|1536X695|zh-CN|||'
        };
        this.linkID = '';
        this.cache = {};
        this.authorization = '';

        // Token缓存相关
        this.tokenConfig = {
            yun_cookie: '',
            yun_account: '',
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
                yun_cookie: jsonData.yun_cookie || '',
                yun_account: jsonData.yun_account || '',
                lastUpdate: Date.now()
            };
            console.log('移动 Token配置已从文件加载并缓存');
        } catch (err) {
            if (err.code === 'ENOENT') {
               // console.error('tokenm.json文件不存在。使用空配置。');
            } else if (err instanceof SyntaxError) {
              //  console.error('tokenm.json文件格式错误');
            } else {
                console.error('加载移动 token配置时出错:', err.message);
            }
            this.tokenConfig = {
                yun_cookie: '',
                yun_account: '',
                lastUpdate: 0
            };
        }
    }

    // 设置文件监听
    setupFileWatcher() {
        try {
            fs.watch(this.tokenFile, (eventType, filename) => {
                if (eventType === 'change') {
                    //console.log('检测到tokenm.json文件变化，重新加载配置');
                    this.loadTokenConfig();
                }
            });
           // console.log('已设置tokenm.json文件监听');
        } catch (err) {
           // console.error('设置文件监听失败:', err.message);
        }
    }

    // 检查并刷新缓存
    checkAndRefreshCache() {
        if (Date.now() - this.tokenConfig.lastUpdate > this.cacheExpire) {
            console.log('移动 Token缓存已过期，重新加载');
            this.loadTokenConfig();
        }
    }

    // 使用 getter 定义动态属性，自动检查缓存
    get cookie() {
        this.checkAndRefreshCache();
        return this.tokenConfig.yun_cookie;
    }

    get account() {
        this.checkAndRefreshCache();
        return this.tokenConfig.yun_account;
    }

    async init() {
        if (this.cookie) {
            console.log('移动cookie获取成功');
            const cookie = this.cookie.split(';');
            if (this.authorization === '') {
                cookie.forEach((item) => {
                    if (item.indexOf('authorization') !== -1) {
                        this.authorization = item.replace('authorization=', '').trim();
                        console.log('authorization获取成功:' + this.authorization);
                    }
                });
            }
        } else {
            console.error("请先获取移动cookie");
        }
        if (this.account) {
            console.log("移动账号获取成功");
        }
    }

    encrypt(data) {
        let t = CryptoJS.lib.WordArray.random(16), n = "";
        if ("string" == typeof data) {
            const o = CryptoJS.enc.Utf8.parse(data);
            n = CryptoJS.AES.encrypt(o, this.x, { iv: t, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        } else if (typeof data === 'object' && data !== null) {
            const a = JSON.stringify(data), s = CryptoJS.enc.Utf8.parse(a);
            n = CryptoJS.AES.encrypt(s, this.x, { iv: t, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        }
        return CryptoJS.enc.Base64.stringify(t.concat(n.ciphertext));
    }

    decrypt(data) {
        const t = CryptoJS.enc.Base64.parse(data), n = t.clone(), i = n.words.splice(4);
        n.init(n.words), t.init(i);
        const o = CryptoJS.enc.Base64.stringify(t), a = CryptoJS.AES.decrypt(o, this.x, { iv: n, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }), s = a.toString(CryptoJS.enc.Utf8);
        return s.toString();
    }

    async getShareID(url) {
    // 新增适配 /w/i/[linkID] 格式的正则，优先匹配
    const regex = /https:\/\/caiyun.139.com\/w\/i\/([^\/]+)/;
    const matches = regex.exec(url) 
        || /https:\/\/caiyun.139.com\/m\/i\?([^&]+)/.exec(url)  // 保留旧版/m/i?格式支持
        || this.regex.exec(url);  // 保留原有regex的优先级（若有）

    if (matches && matches[1]) {
        this.linkID = matches[1];  // 提取linkID（如2oRhbS0Yhox15）
        return this.linkID;  // 建议返回结果，方便外部判断
    }
    return null;  // 明确返回null，标识提取失败
}


    async getShareInfo(pCaID) {
        if (!this.linkID) {
            console.error('linkID is not set. Please call getShareID first.');
            return null;
        }
        const cacheKey = `${this.linkID}-${pCaID}`;
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        let data = JSON.stringify(this.encrypt(JSON.stringify({
            "getOutLinkInfoReq": {
                "account": "",
                "linkID": this.linkID,
                "passwd": "",
                "caSrt": 1,
                "coSrt": 1,
                "srtDr": 0,
                "bNum": 1,
                "pCaID": pCaID,
                "eNum": 200
            },
            "commonAccountInfo": { "account": "", "accountType": 1 }
        })));
        try {
            const resp = await axios.post(this.baseUrl + 'getOutLinkInfoV6', data, { headers: this.baseHeader });
            if (resp.status !== 200) {
                return null;
            }
            const json = JSON.parse(this.decrypt(resp.data)).data;
            this.cache[cacheKey] = json; // 缓存结果
            return json;
        } catch (error) {
            console.error('Error processing share info:', error);
            return null;
        }
    }

    async getShareData(url) {
        if (!url) {
            return {};
        }
        const isValidUrl = url.startsWith('http');
        let pCaID = isValidUrl ? 'root' : url;
        if (isValidUrl) {
            await this.getShareID(url);
        }
        let file = {};
        let fileInfo = await this.getShareFile(pCaID);
        if (fileInfo && Array.isArray(fileInfo)) {
            await Promise.all(fileInfo.map(async (item) => {
                if (!(item.name in file)) {
                    file[item.name] = [];
                }
                let filelist = await this.getShareUrl(item.path);
                if (filelist && filelist.length > 0) {
                    file[item.name].push(...filelist);
                }
            }));
        }
        for (let key in file) {
            if (file[key].length === 0) {
                delete file[key];
            }
        }
        if (Object.keys(file).length === 0) {
            file['root'] = await this.getShareFile(url);
            if (file['root'] && Array.isArray(file['root'])) {
                file['root'] = file['root'].filter(item => item && Object.keys(item).length > 0);
            }
        }
        return file;
    }

    async getShareFile(pCaID) {
        if (!pCaID) {
            return null;
        }
        try {
            const isValidUrl = pCaID.startsWith('http');
            pCaID = isValidUrl ? 'root' : pCaID;
            const json = await this.getShareInfo(pCaID);
            if (!json || !json.caLst) {
                return null;
            }
            const caLst = json?.caLst;
            const names = caLst.map(it => it.caName);
            const rootPaths = caLst.map(it => it.path);
            const filterRegex = /App|活动中心|免费|1T空间|免流/;
            const videos = [];
            if (caLst && caLst.length > 0) {
                names.forEach((name, index) => {
                    if (!filterRegex.test(name)) {
                        videos.push({ name: name, path: rootPaths[index] });
                    }
                });
                let result = await Promise.all(rootPaths.map(async (path) => this.getShareFile(path)));
                result = result.filter(item => item !== undefined && item !== null);
                return [...videos, ...result.flat()];
            }
        } catch (error) {
            console.error('Error processing share data:', error);
            return null;
        }
    }

    async getShareUrl(pCaID) {
        try {
            const json = await this.getShareInfo(pCaID);
            if (!json || !('coLst' in json)) {
                return null;
            }
            const coLst = json.coLst;
            if (coLst !== null) {
                const filteredItems = coLst.filter(it => it && it.coType === 3);
                return filteredItems.map(it => ({
                    name: it.coName,
                    contentId: it.path,
                    linkID: this.linkID
                }));
            } else if (json.caLst !== null) {
                const rootPaths = json.caLst.map(it => it.path);
                let result = await Promise.all(rootPaths.map(path => this.getShareUrl(path)));
                result = result.filter(item => item && item.length > 0);
                return result.flat();
            }
        } catch (error) {
            console.error('Error processing share URL:', error);
            return null;
        }
    }

    async getSharePlay(contentId, linkID) {
        let data = {
            "getContentInfoFromOutLinkReq": {
                "contentId": contentId.split('/')[1],
                "linkID": linkID,
                "account": ""
            },
            "commonAccountInfo": {
                "account": "",
                "accountType": 1
            }
        };
        let resp = await axios.post(this.baseUrl + 'getContentInfoFromOutLink', data, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Content-Type': 'application/json'
            }
        });
        if (resp.status === 200 && resp.data.data !== null) {
            let data = resp.data;
            return data.data.contentInfo.presentURL;
        }
    }

    async refreshYunCookie(from = '') {
        const nowCookie = this.cookie;
        const cookieSelfRes = await axios({
            url: "https://yun.139.com/",
            method: "GET",
            headers: {
                "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                Cookie: nowCookie
            }
        });
        const cookieResDataSelf = cookieSelfRes.headers;
        const resCookie = cookieResDataSelf['set-cookie'];
        if (!resCookie) {
            console.log(`${from}自动更新移动云 cookie: 没返回新的cookie`);
            return;
        }
        const cookieObject = COOKIE.parse(resCookie);
        if (cookieObject.authorization) {
            const newCookie = COOKIE.stringify({
                authorization: cookieObject.authorization
            });
            console.log(`${from}自动更新移动云 cookie: ${newCookie}`);
            // 仅更新内存缓存，不写入文件
            this.tokenConfig.yun_cookie = newCookie;
            this.tokenConfig.lastUpdate = Date.now();
        }
    }

    async getDownload(contentId, linkID) {
        await this.init();
        let data = this.encrypt(JSON.stringify({
            "dlFromOutLinkReqV3": {
                "linkID": linkID,
                "account": this.account,
                "coIDLst": {
                    "item": [contentId]
                }
            },
            "commonAccountInfo": {
                "account": this.account,
                "accountType": 1
            }
        }));
        let resp = await axios.post(this.baseUrl + 'dlFromOutLinkV3', data, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
                "Connection": "keep-alive",
                "Accept": "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br",
                "Content-Type": "application/json",
                "accept-language": "zh,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6",
                "authorization": this.authorization,
                "content-type": "application/json;charset=UTF-8",
                'hcy-cool-flag': '1',
                'x-deviceinfo': '||3|12.27.0|chrome|136.0.0.0|189f4426ca008b9cbe9bf9bd79723d77||windows 10|1536X695|zh|||'
            }
        });
        if (resp.status === 200) {
            let json = JSON.parse(this.decrypt(resp.data));
            const redrUrl = json.data.redrUrl;
            const test_result = await this.testSupport(redrUrl, {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Cookie': this.cookie
            });
            if (!test_result[0]) {
                try {
                    await this.refreshYunCookie('getDownload');
                } catch (e) {
                    console.log(`getDownload:自动刷新移动云cookie失败:${e.message}`);
                }
            }
            return redrUrl;
        }
        return null;
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

export const Yun = new YunDrive();