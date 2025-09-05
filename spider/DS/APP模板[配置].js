/*
@header({
  lang: 'ds'
})
*/

const {
    readFileSync,
    writeFileSync
} = require('fs');
const process = require('process');
const path = require('path');
let App_Path = './pz/App模板配置.json';
let App_Data = JSON.parse(readFileSync(App_Path, 'utf-8'));

var rule = {
    类型: '影视',
    title: 'APP模板配置',
    author: 'wow',
    host: '',
    searchable: 1,
    quickSearch: 0,
    filterable: 1,
    timeout: 5000,
    play_parse: true,
    hikerListCol: 'avatar',
    hikerClassListCol: 'text_2',
    // home_flag: '3-0-S',
    home_flag: '1',
    more: {
        sourceTag: '设置,动作',
        actions: [{
            name: 'APP模板|配置相关',
            action: JSON.stringify({
                actionId: '单选菜单',
                type: 'menu',
                title: 'Action菜单',
                width: 500,
                column: 1,
                option: [
                    '导入分享配置$menu1',
                    '分享APP配置$menu2'
                ],
                selectedIndex: 0
            })
        }]
    },
    class_parse: async function() {
        let {
            jsonUrl
        } = this;
       // const config_path = urljoin(jsonUrl, './App模板配置.json');
      //  rule.config = JSON.parse(await request(config_path));
      rule.config = App_Data;
        let classes = Object.keys(rule.config).map(key => {
            return {
                type_name: `${key}(${Object.keys(rule.config[key]).filter(item => item != '示例').length})`,
                type_id: key,
                type_flag: '[AN:分享APP配置,分享APP配置(多选),删除APP配置,删除APP配置(多选)][CFS][CFPY]1'
            };
        })
        return {
            class: classes
        }
    },
    推荐: async function(tid, pg, filter, extend) {},
    一级: async function(tid, pg, filter, extend) {
        let {
            publicUrl,
            MY_FL,
            MY_CATE,
            MY_PAGE
        } = this;
        const ICON_URL = urljoin(publicUrl, './images/icon_cookie/'); // 继承设置中心的图标路径
        const ICONS = {
            配置: urljoin(ICON_URL, '配置.png'),

        };
        if (MY_PAGE > 1) return [];

        // 新增配置动作
        const addConfigAction = {
            vod_id: JSON.stringify({
                actionId: `${MY_CATE}`,
                type: 'multiInput',
                title: `新增${MY_CATE}配置`,
                width: 640,
                height: 500,
                msg: '请填写配置信息',
                keep: true,
                canceledOnTouchOutside: false,
                button: 2,
                input: [{
                    id: 'name',
                    name: '设置源名',
                    tip: '输入源名（不可重复）',
                    value: ''
                }].concat(Object.keys(rule.config[MY_CATE]?.['示例'] || {}).map(it => ({
                    id: it,
                    name: `设置${it}`,
                    tip: `${it}:${rule.config[MY_CATE]['示例']?.[it] || ''}`,
                    value: '',
                    selectData: it === 'verify' ? '开启:=true,关闭:=false' : it === 'muban' ? 'AppGet:=AppGet,AppQiji:=AppQiji' : ''
                })))
            }),
            vod_name: `🚦新增🚦配置`,
            vod_pic: ICONS.配置,
            vod_tag: 'action'
        };

        // 导入配置动作
        const importAction = {
            vod_id: JSON.stringify({
                actionId: '导入配置',
                type: 'input',
                title: '导入分享配置',
                width: 700,
                height: 650,
                msg: '支持格式：模板$源名$URL 或 JSON',
                value: '',
                tip: '示例：AppGet$小红$http://www.xiaohys.com$ENonBHeVBoYZhVUV',
                keep: true,
                canceledOnTouchOutside: false,
                button: 2
            }),
            vod_name: `🚦导入🚦分享配置`,
            vod_pic: ICONS.配置,
            vod_tag: 'action'
        };
        const radioMenuAction = {
            // vod_id：序列化的单选菜单配置（核心配置）
            vod_id: JSON.stringify({
                actionId: '单选菜单', // 动作标识：区分是单选菜单类型
                type: 'menu', // 类型：菜单（单选）
                title: '选择操作模式', // 菜单标题
                width: 500, // 菜单宽度
                height: 400, // 菜单高度
                msg: '请从以下选项中选择一项操作', // 菜单提示文字
                // 单选选项列表（格式：显示文本$唯一标识，用于区分选项）
                option: [
                    '导入分享配置$menu1',
                    '分享APP配置$menu2'
                ],

                selectedIndex: 0, // 默认选中的选项索引（0表示第一个选项）
                column: 1, // 选项排列列数（1列=垂直排列）
                tip: '选择后将应用对应模式的配置', // 辅助提示文字
                keep: true, // 是否保留历史状态
                canceledOnTouchOutside: false, // 点击外部是否关闭菜单（否）
                button: 2 // 底部按钮数量（2=确认+取消）
            }),
            vod_name: `🚦单选🚦配置`,
             // 菜单显示名称（带图标）
            vod_pic: ICONS.配置, // 菜单图标（假设ICONS中有"菜单"图标）
            vod_tag: 'action' // 标签分类（动作类）
        };
        
        const multiSelectMenuAction = {
  vod_id: JSON.stringify({
    actionId: '多选菜单',
    type: 'select',
    title: '选择多项操作',
    width: 500,
    height: 400,
    msg: '请从以下选项中选择多项操作（可多选）',
    option: [
      '多选菜单分享$menu1',
      '多选菜单删除$menu2'
    ],
    multiple: true,
    value: [],
    column: 1,
    tip: '选择后将批量执行选中的操作',
    keep: true,
    canceledOnTouchOutside: false,
    button: 2
  }),
  vod_name: `🚦多选🚦配置`,
  vod_pic: ICONS.配置,
  vod_tag: 'action'
};
        // 删除配置动作
        const deleteAction = {
            vod_id: JSON.stringify({
                actionId: '删除APP配置',
                type: 'select',
                title: '删除配置',
                width: 600,
                height: 400,
                msg: '请选择要删除的配置（支持多选）',
                keep: true,
                canceledOnTouchOutside: false,
                button: 2,
                column: 1,
                multiple: true,
                option: getConfigArr(),
                value: []
            }),
            vod_name: `🚦删除🚦配置`,
            vod_pic: ICONS.配置,
            vod_tag: 'action'
        };

        // 配置项列表（修复：添加oldName字段）
        // 修改配置项列表部分
        let configItems = Object.keys(rule.config[MY_CATE] || {})
            .filter(key => key !== '示例' && key !== '说明')
            .map(item => {
                const example = rule.config[MY_CATE]['示例'] || {};
                const itemData = rule.config[MY_CATE][item] || {};
                rule.VodName = `${MY_CATE}$${item}`;
                return ({
                    vod_id: JSON.stringify({
                        actionId: '修改配置',
                        type: 'multiInput',
                        title: `修改${MY_CATE}配置`,
                        width: 640,
                        height: 500,
                        msg: '修改配置信息',
                        keep: true,
                        canceledOnTouchOutside: false,
                        button: 2,
                        input: [{
                                id: 'MB',
                                name: '模板类型(不可修改)',
                                tip: '固定值，不可修改',
                                value: MY_CATE,
                                disabled: true
                            },
                            {
                                id: 'name',
                                name: '设置源名',
                                tip: `修改源名（当前：${item}）`,
                                value: item
                            }
                        ].concat(Object.keys(example).map(it => {
                            let fieldValue;
                            if (it === 'host') fieldValue = itemData.host || itemData.url || itemData.site || '';
                            else if (it === 'key') fieldValue = itemData.key || itemData.dataKey || '';
                            else if (it === 'iv') fieldValue = itemData.iv || itemData.dataIv || '';
                            else if (it.includes('header')) fieldValue = JSON.stringify(itemData[it] || '{}');
                            else fieldValue = itemData[it] || '';

                            return {
                                id: it,
                                name: `设置${it}`,
                                tip: example[it],
                                value: fieldValue,
                                selectData: it === 'verify' ? '开启:=true,关闭:=false' : ''
                            };
                        }))
                    }),
                    vod_name: MY_CATE + '$' + item,
                    vod_pic: '0',
                    vod_pic: ICONS.配置,
                    vod_tag: 'action'
                });
            });

        // 整合所有动作
        let d = [addConfigAction, importAction, deleteAction ].concat(configItems);
        if (MY_FL.custom) d = d.filter(it => it.vod_name.includes(MY_FL.custom));
        if (MY_FL.custom_pinyin) d = d.filter(it => getFirstLetter(it.vod_name).includes(MY_FL.custom_pinyin));
        return d;
    },
        
        
        /*
        if (MY_FL.custom) {
            d = d.filter(it => it.vod_name.includes(MY_FL.custom));
        } else if (MY_FL.custom_pinyin) {
            d = d.filter(it => getFirstLetter(it.vod_name).includes(MY_FL.custom_pinyin));
        }
        return d;
    },
    */
    action: async function(action, value) {
        rule.config = rule.config || readConfig();
        if (action == '单选菜单') {
            try {
                value = JSON.parse(value);
                value = value.option[value.selectedIndex].action;
            } catch (e) {}
            if (value == 'menu1') {
                return JSON.stringify({
                    action: {
                        actionId: '编辑配置',
                        type: 'edit',
                        id: 'share',
                        title: '编辑配置',
                        width: 700,
                        height: 650,
                        msg: '粘贴获取到的分享配置',
                        value: '',
                        tip: '格式有要求，可长按已有配置选择 分享APP配置 查看'
                    }
                })
            } else if (value == 'menu2') {
                return JSON.stringify({
                    action: {
                        actionId: '多选菜单分享',
                        type: 'select',
                        title: '分享配置多选菜单',
                        width: 700,
                        column: 3,
                        option: getConfigArr()
                    }
                })
            }
        }

        const actions = Object.keys(rule.config).map(key => key);
        const index = actions.indexOf(action);
        if (index !== -1) {
            let Value = {};
            value = JSON.parse(value);
            try {
                value.input.forEach(item => {
                    Value[item.id] = item.value;
                });
                value = Value;
            } catch (e) {}
            let {
                name,
                ...config
            } = value;
            if (name) {
                const names = Object.keys(rule.config[actions[index]]).map(key => key);
                if (!names.includes(name)) {
                    Object.keys(config).forEach(it => {
                        if (it.includes('header')) {
                            config[it] = config[it] ? JSON.parse(config[it]) : {};
                        }
                        config[it] = config[it];
                    });
                    rule.config[actions[index]][name] = config;
                    writeConfig(rule.config);
                    return JSON.stringify({
                        action: {
                            actionId: '__refresh_list__'
                        },
                        toast: `【${actions[index]}:${name}】配置添加成功`
                    });
                } else {
                    return '已经存在相同名字的源';
                }
            } else {
                return '请输入源名';
            }
        } else if (action == '修改配置') {
            let Value = {};
            value = JSON.parse(value);
            try {
                value.input.forEach(item => {
                    Value[item.id] = item.value;
                });
                value = Value;
            } catch (e) {}
            let {
                MB,
                name,
                ...config
            } = value;
            if (name) {
                Object.keys(config).forEach(it => {
                    if (it.includes('header')) {
                        config[it] = config[it] ? JSON.parse(config[it]) : {};
                    }
                    config[it] = config[it];
                });
                rule.config[MB][name] = config;
                writeConfig(rule.config);
                return JSON.stringify({
                    action: {
                        actionId: '__refresh_list__',
                    },
                    toast: `【${MB}:${name}】配置修改成功`
                });
            } else {
                return '请输入源名';
            }
        } else if (action == '删除APP配置') {
            let MB = '';
            let name = '';
            try {
            let parsedValue = JSON.parse(value);
                name = parsedValue.filter(item => item.selected === true).map(item => item.name);
                MB = parsedValue.filter(item => item.selected === true).map(item => item.action);
                
             //   MB = JSON.parse(value).value.split('$')[0];
             //   name = JSON.parse(value).value.split('$')[1];
            } catch (e) {
                MB = value.split('$')[0];
                name = value.split('$')[1];
            }
            delete rule.config[MB][name];
            writeConfig(rule.config);
            return `【${MB}:${name}】配置已删除`
           /* JSON.stringify({
                action: {
                    actionId: '__refresh_list__'
                },
                toast: `【${MB}:${name}】配置已删除`
            });*/
        } else if (action == '删除APP配置(多选)') {
            let MB = '';
            try {
              //  MB = JSON.parse(value).value.split('$')[0];
              let parsedValue = JSON.parse(value);
                name = parsedValue.filter(item => item.selected === true).map(item => item.name);
                MB = parsedValue.filter(item => item.selected === true).map(item => item.action);
            } catch (e) {
                MB = value.split('$')[0];
            }
            return JSON.stringify({
                action: {
                    actionId: '多选菜单删除',
                    type: 'select',
                    title: '删除配置多选菜单',
                    width: 700,
                    column: 3,
                    option: Object.keys(rule.config[MB]).filter(key => key !== '示例')
                        .map(name => {
                            return {
                                name: name,
                                action: MB,
                                selected: false
                            }
                        })
                }
            })
        } else if (action == '多选菜单删除') {
            let list = [];
            try {
                list = JSON.parse(value).option.filter(it => it.selected);
            } catch (e) {
                list = JSON.parse(value).filter(it => it.selected);
            }
            list.forEach(item => {
                delete rule.config[item.action][item.name];
            });
            writeConfig(rule.config);
            return JSON.stringify({
                action: {
                    actionId: '__refresh_list__'
                },
                toast: `${list.length}个配置已删除`
            });
        } else if (action == '分享APP配置') {
            let MB = '';
            let name = '';
            try {
                MB = JSON.parse(value).value.split('$')[0];
                name = JSON.parse(value).value.split('$')[1];
            } catch (e) {
                MB = value.split('$')[0];
                name = value.split('$')[1];
            }
            let share_config = {};
            share_config[MB] = {};
            share_config[MB][name] = rule.config[MB][name];
            return JSON.stringify({
                action: {
                    actionId: '__copy__',
                    content: JSON.stringify(share_config, null, 4)
                },
                toast: `【${MB}:${name}】配置已复制到剪贴板`
            });
        } else if (action == '分享APP配置(多选)') {
            let MB = '';
            try {
                MB = JSON.parse(value).value.split('$')[0];
            } catch (e) {
                MB = value.split('$')[0];
            }
            return JSON.stringify({
                action: {
                    actionId: '多选菜单分享',
                    type: 'select',
                    title: '分享配置多选菜单',
                    width: 700,
                    column: 3,
                    option: Object.keys(rule.config[MB]).filter(key => key !== '示例')
                        .map(name => {
                            return {
                                name: name,
                                action: MB,
                                selected: false
                            }
                        })
                }
            })
        } else if (action == '多选菜单分享') {
            let list = [];
            try {
                list = JSON.parse(value).option.filter(it => it.selected);
            } catch (e) {
                list = JSON.parse(value).filter(it => it.selected);
            }
            let share_config = {};
            list.forEach(item => {
                if (!share_config[item.action]) {
                    share_config[item.action] = {};
                }
                share_config[item.action][item.name] = rule.config[item.action][item.name];
            });

            return JSON.stringify({
                action: {
                    actionId: '__copy__',
                    content: JSON.stringify(share_config, null, 4)
                },
                toast: `${list.length}个配置已复制到剪贴板`
            });
            return ''
        } else if (action === '导入配置') {
            try {
                console.log('\n【导入配置】原始输入:', value);
                let share = '';
                let parsedValue;
                if (typeof value === 'string') {
                    try {
                        parsedValue = JSON.parse(value);
                    } catch (e) {
                        share = value.trim();
                    }
                } else {
                    parsedValue = value;
                }
                if (parsedValue && typeof parsedValue === 'object') {
                    if (parsedValue.value !== undefined) {
                        share = String(parsedValue.value).trim();
                    } else {
                        const entries = Object.entries(parsedValue);
                        if (entries.length > 0) {
                            share = String(entries[0][1]).trim();
                        }
                    }
                }
                console.log('【导入配置】提取的配置内容:', share);
                if (!share) {
                    return JSON.stringify({
                        action: {
                            actionId: '__keep__'
                        },
                        toast: '请输入配置内容（不能为空）',
                        type: 'error'
                    });
                }
                const segmentConfig = {
                    "appget": 4,
                    "appshark": 5,
                    "default": 3
                };
                let config;
                if (share.includes('$')) {
                    const parts = share.split('$')
                        .map(part => part.trim())
                        .filter(part => part !== '');
                    const templateType = parts[0]?.toLowerCase();
                    const requiredSegments = segmentConfig[templateType] || segmentConfig.default;
                    if (parts.length !== requiredSegments) {
                        throw new Error(`${templateType || '通用'}模板需${requiredSegments}段（当前${parts.length}段）`);
                    }
                    const [MB, name, ...params] = parts;
                    config = {
                        [MB]: {
                            [name]: {}
                        }
                    };
                    if (templateType === 'appget') {
                        config[MB][name] = {
                            url: params[0],
                            key: params[1]
                        };
                    } else {
                        config[MB][name] = {
                            url: params[0]
                        };
                    }
                } else {
                    if (share === '{}') throw new Error('JSON不能为空对象');
                    config = JSON.parse(share);
                }
                Object.keys(config).forEach(muban => {
                    if (!rule.config[muban]) rule.config[muban] = {};
                    const importedItems = config[muban];
                    Object.keys(importedItems).forEach(name => {
                        rule.config[muban][name] = importedItems[name];
                    });
                });
                writeConfig(rule.config);
                return JSON.stringify({
                    action: {
                        actionId: '__refresh_list__'
                    },
                    toast: '导入成功',
                    type: 'success'
                });
            } catch (e) {
                console.error('导入失败:', e);
                return JSON.stringify({
                    action: {
                        actionId: '__keep__'
                    },
                    toast: `导入失败：${e.message}`,
                    type: 'error'
                });
            }
        }
        return `没有动作:${action}的可执行逻辑`;
    
    }
};

function writeConfig(config) {
    // 检查config是否为null、undefined或空对象
    if (!config || typeof config !== 'object' || Object.keys(config).length === 0) {
        console.error('错误：配置内容不能为空');
        return; // 直接返回，不执行后续代码
    }

    const configPath = path.join(process.cwd(), 'pz', 'App模板配置.json');
    try {
        writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
        console.log('配置写入完成');
    } catch (error) {
        console.error('配置写入出错:', error.message);
    }
}

function readConfig() {
    const configPath = path.join(process.cwd(), 'pz', 'App模板配置.json');
    try {
        let config = readFileSync(configPath, 'utf8');
        config = JSON.parse(config);
        return config;
    } catch (error) {
        console.error('配置读取出错:', error.message);
        return {};
    }
}

function getConfigArr() {
    let data = readConfig();
    let result = [];
    for (const [action, items] of Object.entries(data)) {
        // 遍历每个分类下的所有项目
        for (const name of Object.keys(items)) {
if (!['示例', '说明'].includes(name)) {
                result.push({
                    name: name,
                    action: action,
                    selected: false
                });
            }
        }
    }
    return result;
}