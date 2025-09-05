import path from "path";
import { existsSync, readFileSync } from "fs";

export function getQueryObj(query) {
    const searchParams = new URLSearchParams(query);
    const queryObject = {};
    for (const [key, value] of searchParams.entries()) {
        queryObject[key] = value;
    }
    return queryObject;
}


export function getSitesMap(configDir) {
    let SitesMap = {};
    const SitesMapPath = path.join(configDir, '../pz/传参.json');
    
    if (existsSync(SitesMapPath)) {
        try {
            const SitesMapText = readFileSync(SitesMapPath, 'utf-8');
            const config = JSON.parse(SitesMapText);
            
            for (const [siteKey, siteData] of Object.entries(config)) {
                // 初始化主站点数组
                if (!SitesMap[siteKey]) {
                    SitesMap[siteKey] = [];
                }
                
                // 处理单层结构（直接包含url或site）
                if (siteData.url || siteData.site) {
                    const url = siteData.url || siteData.site;
                    const dataKey = siteData.dataKey;
                    const dataIv = siteData.dataIv;
                    
                    // 构建查询参数
                    let params = url;
                    if (dataKey) {
                        if (dataIv && dataIv !== dataKey) {
                            params = `${url}$${dataKey}$${dataIv}`;
                        } else {
                            params = `${url}$${dataKey}`;
                        }
                    }
                    
                    const queryStr = `?type=url&params=${encodeURIComponent(params)}`;
                    
                    // 使用主站点键作为别名
                    SitesMap[siteKey].push({
                        alias: siteKey,
                        queryStr: queryStr,
                        queryObject: getQueryObj(queryStr),
                    });
                } 
                // 处理双层结构（主站点→子站点）
                else {
                    for (const [alias, paramsObj] of Object.entries(siteData)) {
                        const url = paramsObj.url || paramsObj.site;
                        if (url) {
                            const dataKey = paramsObj.dataKey;
                            const dataIv = paramsObj.dataIv;
                            
                            // 构建查询参数
                            let params = url;
                            if (dataKey) {
                                if (dataIv && dataIv !== dataKey) {
                                    params = `${url}$${dataKey}$${dataIv}`;
                                } else {
                                    params = `${url}$${dataKey}`;
                                }
                            }
                            
                            // 对于AppGet类型，添加[APP]后缀
                            const finalAlias = siteKey.includes('AppGet') ? `${alias}[APP]` : alias;
                            
                            const queryStr = `?type=url&params=${encodeURIComponent(params)}`;
                            
                            SitesMap[siteKey].push({
                                alias: finalAlias,
                                queryStr: queryStr,
                                queryObject: getQueryObj(queryStr),
                            });
                        }
                    }
                }
            }
            return SitesMap;
        } catch (e) {
            console.error("Error parsing sites map:", e);
        }
    }
    return SitesMap;
}