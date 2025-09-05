const { getHtml } = $.require('./_lib.request.js');

// 弹幕代理核心逻辑
async function proxy_rule(params) {
    try {
        // 校验参数并获取目标地址
        if (!params || !params.url) {
            throw new Error('请求参数缺失或缺少url字段');
        }
        const targetUrl = decodeURIComponent(params.url);
        if (!targetUrl) {
            throw new Error('解析后目标地址为空');
        }
        console.log(`[弹幕流程] 开始代理请求 - 目标URL: ${targetUrl}`);
        
        // 发送请求
        let resp = await getHtml({ url: targetUrl });
        
        // 校验resp是否有效
        if (!resp || typeof resp !== 'object' || !('status' in resp)) {
            throw new Error(`无效响应: ${JSON.stringify(resp)}`);
        }
        
        console.log(`[弹幕流程] 代理请求完成 - 状态: ${resp.status}, 数据长度: ${resp.data?.length || 0} 字符`);
        
        // 根据URL选择对应解析器
        const url = targetUrl.toLowerCase();
        let parsedDanmu;
        let parserUsed = '通用解析器';
        
        // 尝试专属解析器
        if (url.includes('mgtv.com')) {
            console.log(`[弹幕流程] 尝试芒果弹幕解析器`);
            parsedDanmu = await getMGDanmu(resp.data, targetUrl);
            parserUsed = '芒果';
        } 
        if (!parsedDanmu || parsedDanmu === '<?xml version="1.0" encoding="UTF-8"?><i></i>') {
            if (url.includes('qq.com')) {
                console.log(`[弹幕流程] 尝试腾讯弹幕解析器`);
                parsedDanmu = await getQQDanmu(resp.data);
                parserUsed = '腾讯';
            }
        }
        
        // 如果专属解析器没有数据，使用通用解析器
        if (!parsedDanmu || parsedDanmu === '<?xml version="1.0" encoding="UTF-8"?><i></i>') {
            console.log(`[弹幕流程] 使用通用弹幕解析器`);
            parsedDanmu = await getPublicDanmu(resp.data);
            parserUsed = '通用';
        }
        
        console.log(`[弹幕流程] ${parserUsed}解析完成 - XML长度: ${parsedDanmu.length} 字符`);
        return [200, 'text/xml', parsedDanmu];
    } catch (error) {
        console.error(`[弹幕流程] 代理/解析失败: ${error.message}`);
        return [200, 'text/xml', '<?xml version="1.0" encoding="UTF-8"?><i></i>'];
    }
}

// 解析芒果TV弹幕
async function getMGDanmu(data, targetUrl) {
    const baseXml = '<?xml version="1.0" encoding="UTF-8"?><i>';
    
    // 检查数据结构是否匹配
    if (!data || typeof data !== 'object') {
        console.log(`[芒果弹幕] 数据无效 - 非对象类型`);
        return baseXml + '</i>';
    }
    
    // 尝试两种可能的芒果弹幕数据结构
    let cdn, version;
    
    // 结构1: 直接包含cdn_list和cdn_version
    if (data?.data?.cdn_list) {
        console.log(`[芒果弹幕] 使用标准数据结构`);
        cdn = data.data.cdn_list.split(",")[0]?.replace(/^https?:\/\//, '');
        version = data.data.cdn_version;
    } 
    // 结构2: 包含video_id和clip_id
    else if (data?.data?.video_id) {
        console.log(`[芒果弹幕] 使用备用数据结构`);
        // 从原始URL提取vid
        const vidMatch = targetUrl.match(/vid=(\w+)/);
        const vid = vidMatch ? vidMatch[1] : '';
        
        if (!vid) {
            console.log(`[芒果弹幕] 无法从URL提取vid`);
            return baseXml + '</i>';
        }
        
        cdn = `cmts.mgtv.com/vod.do`;
        version = `${vid.slice(0, 2)}/${vid.slice(2, 4)}/${vid}`;
    } else {
        console.log(`[芒果弹幕] 无法识别的数据结构`);
        return baseXml + '</i>';
    }
    
    console.log(`[芒果弹幕] 提取CDN信息 - cdn: ${cdn}, version: ${version}`);
    
    if (!cdn || !version) {
        console.log(`[芒果弹幕] 缺少CDN信息 - 无法获取弹幕`);
        return baseXml + '</i>';
    }
    
    // 生成分片URL
    const urls = Array.from({ length: 121 }, (_, i) => `https://${cdn}/${version}/${i}.json`);
    console.log(`[芒果弹幕] 生成分片URL - 共${urls.length}个分片`);
    
    let danmu = baseXml;
    let totalDanmu = 0;
    
    try {
        const responses = await Promise.allSettled(urls.map(url => getHtml({ url })));
        
        responses.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const res = result.value;
                if (res.status !== 200) {
                    return;
                }
                
                const list = res.data;
                if (list?.data?.items) {
                    const count = list.data.items.length;
                    console.log(`[芒果弹幕] 分片${index+1}解析完成 - ${count}条弹幕`);
                    totalDanmu += count;
                    
                    list.data.items.forEach(item => {
                        const time = (item.time || 0) / 1000;
                        const content = escapeXml(item.content || '');
                        danmu += `<d p="${time},1,25,${gcolor()}">${content}</d>`;
                    });
                }
            }
        });
        
        console.log(`[芒果弹幕] 全部完成 - 共解析${totalDanmu}条弹幕`);
    } catch (error) {
        console.error(`[芒果弹幕] 批量请求失败: ${error.message}`);
    }
    
    return totalDanmu > 0 ? danmu + '</i>' : baseXml + '</i>';
}

// 解析腾讯视频弹幕
async function getQQDanmu(data) {
    const baseXml = '<?xml version="1.0" encoding="UTF-8"?><i>';
    
    // 检查数据结构是否匹配
    if (!data || typeof data !== 'object') {
        console.log(`[腾讯弹幕] 数据无效 - 非对象类型`);
        return baseXml + '</i>';
    }
    
    // 支持多种腾讯弹幕格式
    let comments = [];
    
    // 格式1: 直接包含comments数组
    if (Array.isArray(data.comments)) {
        console.log(`[腾讯弹幕] 使用标准comments格式`);
        comments = data.comments;
    } 
    // 格式2: 包含targetid和contentid的结构
    else if (data.targetid && data.contentid) {
        console.log(`[腾讯弹幕] 使用targetid/contentid格式`);
        comments = data.commentid?.comments || [];
    } 
    // 格式3: 包含"danmu"字段
    else if (Array.isArray(data.danmu?.comment)) {
        console.log(`[腾讯弹幕] 使用danmu.comment格式`);
        comments = data.danmu.comment;
    } else {
        console.log(`[腾讯弹幕] 无法识别的数据结构`);
        return baseXml + '</i>';
    }
    
    if (comments.length === 0) {
        console.log(`[腾讯弹幕] 无有效弹幕数据`);
        return baseXml + '</i>';
    }
    
    console.log(`[腾讯弹幕] 开始解析 - 共${comments.length}条评论`);
    
    let danmu = baseXml;
    let parsedCount = 0;
    
    comments.forEach((item, index) => {
        const timepoint = item.timepoint || item.t || item.timestamp || 0;
        let content = item.content || item.c || '';
        
        if (!content) return;
        
        content = escapeXml(content);
        danmu += `<d p="${timepoint},1,25,${gcolor()}">${content}</d>`;
        parsedCount++;
        
        // 打印前3条示例
        if (index < 3) {
            console.log(`[腾讯弹幕] 示例弹幕${index+1}: ${timepoint}s - ${content.substring(0, 20)}`);
        }
    });
    
    console.log(`[腾讯弹幕] 完成解析 - 有效弹幕: ${parsedCount}/${comments.length}`);
    return parsedCount > 0 ? danmu + '</i>' : baseXml + '</i>';
}

// 解析通用格式弹幕
async function getPublicDanmu(data) {
    const baseXml = '<?xml version="1.0" encoding="UTF-8"?><i>';
    
    // 检查数据结构
    if (!data) {
        console.log(`[通用弹幕] 无数据`);
        return baseXml + '</i>';
    }
    
    let danmaku = [];
    
    // 多种可能的通用格式
    if (Array.isArray(data.danmaku)) {
        danmaku = data.danmaku;
    } else if (Array.isArray(data.danmuku)) {
        danmaku = data.danmuku;
    } else if (Array.isArray(data.comments)) {
        danmaku = data.comments;
    } else if (Array.isArray(data)) {
        danmaku = data;
    } else if (data && typeof data === 'object') {
        // 尝试作为单条弹幕对象处理
        danmaku = [data];
    } else {
        console.log(`[通用弹幕] 无法识别的数据结构`);
        return baseXml + '</i>';
    }
    
    if (danmaku.length === 0) {
        console.log(`[通用弹幕] 空弹幕数组`);
        return baseXml + '</i>';
    }
    
    console.log(`[通用弹幕] 开始解析 - 数据长度: ${danmaku.length}`);
    
    let danmu = baseXml;
    let validCount = 0;
    
    for (const item of danmaku) {
        try {
            let time = 0;
            let content = '';
            
            // 数组格式: [时间, 类型, 颜色, 用户ID, 内容]
            if (Array.isArray(item)) {
                // 查找时间字段
                for (const elem of item) {
                    if (typeof elem === 'number' && elem > 0) {
                        time = elem;
                        break;
                    } else if (typeof elem === 'string' && !isNaN(parseFloat(elem))) {
                        time = parseFloat(elem);
                        break;
                    }
                }
                
                // 查找内容字段 (从后向前)
                for (let i = item.length - 1; i >= 0; i--) {
                    if (typeof item[i] === 'string' && item[i].trim() !== '') {
                        content = item[i].trim();
                        break;
                    }
                }
            } 
            // 对象格式: {time: 12.5, text: "内容"}
            else if (typeof item === 'object') {
                time = item.time || item.t || item.timestamp || item.progress || item.timepoint || 0;
                content = item.text || item.content || item.comment || item.c || '';
            }
            // 其他格式
            else if (typeof item === 'string') {
                content = item;
            }
            
            // 验证数据
            if (!content || content.trim() === '') continue;
            
            // 完整特殊字符转义
            content = escapeXml(content);
            danmu += `<d p="${time},1,25,${gcolor()}">${content}</d>`;
            validCount++;
            
            // 打印前3条示例
            if (validCount <= 3) {
                console.log(`[通用弹幕] 示例弹幕${validCount}: ${time}s - ${content.substring(0, 20)}`);
            }
        } catch (e) {
            console.log(`[通用弹幕] 解析单条弹幕失败: ${e.message}`);
        }
    }
    
    console.log(`[通用弹幕] 完成解析 - 有效弹幕: ${validCount}/${danmaku.length}`);
    return validCount > 0 ? danmu + '</i>' : baseXml + '</i>';
}

// XML特殊字符转义函数
function escapeXml(content) {
    return (content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 随机颜色生成
function gcolor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return (r << 16) + (g << 8) + b;
}

// 导出
$.exports = {
    danmuProxy: {
        proxy_rule: proxy_rule
    }
};