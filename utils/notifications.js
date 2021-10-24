const UA = 'UJN Temperature Bot/1.0';
const express = require('express');
const request = require('request-promise');
const telegramBot = require('node-telegram-bot-api');
const _ = require('lodash');

function createServerChan(serverChanOptions) {
    let key = serverChanOptions.key;

    function send(title, content) {
        return request.post(`https://sctapi.ftqq.com/${key}.send?title=messagetitle&desp=messagecontent`, {
            form: {
                title: title,
                desp: content
            },
            headers: {
                'User-Agent': UA
            },
            simple: false,
            proxy: serverChanOptions.proxy.enable ? serverChanOptions.proxy.url : undefined,
        });
    }

    return async function handler(type, mode, status, username, msg) {
        try {
            // Lazy approach, type can be Array of messages in message queue
            let title = '';
            let content = '';
            if (!type instanceof Array) {
                if (type == 'openid')
                    username = username.substring(0, 8);
                if (mode == 'ehall')
                    title += '[办事大厅] ';
                else
                    title += '[返校健康卡] ';
                if (status) {
                    title += '体温填报成功';
                    content += `用户 ${username} 体温填报成功!`;
                } else {
                    title += '体温填报失败';
                    content += `用户 ${username} 填报失败: ${msg}`;
                }
            } else {
                title = '[汇总] 体温填报成功';
                for (const msg of type) {
                    if (msg.mode == 'ehall') {
                        content += '办事大厅体温填报: ';
                    } else {
                        content += '返校健康卡体温填报: ';
                    }
                    if (msg.type == 'openid') {
                        content += `OpenID 用户 ${msg.username.substring(0, 8)} `;
                    } else {
                        content += `SSO 用户 ${msg.username} `;
                    }
                    if (msg.status == false) {
                        title = '[汇总] 体温填报存在错误';
                        content += `填报失败, 错误信息: ${msg.msg}`
                    } else {
                        content += '填报成功';
                    }
                    content += '\n\n';
                }
            }
            let data = JSON.parse(await send(title.trim(), content.trim()));
            if (data.code != 0) {
                throw new Error(`Failed to send: ${data.message}`);
            }
            console.log(`[PUSH-ServerChan] Push success for user ${username}. PushID: ${data.data.pushid} ReadKey: ${data.data.readkey}`);
        } catch (e) {
            console.log(`[PUSH-ServerChan] Failed to send message for ${username}.`);
            console.log(e);
        }
    }
}

function createTelegramBot(telegramBotOptions) {
    let bot = new telegramBot(telegramBotOptions.token, {
        baseApiUrl: telegramBotOptions.baseApiUrl,
        polling: !telegramBotOptions.webhooks.enable
    });
    let app;
    if (telegramBotOptions.webhooks.enable) {
        app = express();
        app.use(express.json());
        app.post(telegramBotOptions.webhooks.path, (req, res) => {
            bot.processUpdate(req.body);
            res.sendStatus(200);
        });
        app.listen(telegramBotOptions.webhooks.port, telegramBotOptions.addr, () => {
            console.log('[PUSH-Telegram] Webhooks listened!');
        });
        bot.setWebHook(telegramBotOptions.webhooks.url);
    }

    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        if (chatId == telegramBotOptions.chatId) {
            bot.sendMessage(chatId, `Welcome back.`);
        } else {
            bot.sendMessage(chatId, `Your chatId is ${chatId}, please update in config file.`);
        }
    });

    return async function handler(type, mode, status, username, msg) {
        try {
            if (telegramBotOptions.chatId == null) {
                console.log('[PUSH-Telegram] ChatId is not configured!');
                return;
            }
            let title = '';
            let content = '';
            let message = '';
            // Lazy approach, type can be Array of messages in message queue
            if (!type instanceof Array) {
                if (type == 'openid')
                    username = username.substring(0, 8);
                if (mode == 'ehall')
                    message += '[办事大厅] ';
                else
                    message += '[返校健康卡] ';
                if (status) {
                    message += `用户 ${username} 体温填报成功!`;
                } else {
                    message += `用户 ${username} 填报失败: ${msg}`;
                }
            } else {
                title = '[汇总] 体温填报成功';
                for (const msg of type) {
                    if (msg.mode == 'ehall') {
                        content += '办事大厅体温填报: ';
                    } else {
                        content += '返校健康卡体温填报: ';
                    }
                    if (msg.type == 'openid') {
                        content += `OpenID 用户 ${msg.username.substring(0, 8)} `;
                    } else {
                        content += `SSO 用户 ${msg.username} `;
                    }
                    if (msg.status == false) {
                        title = '[汇总] 体温填报存在错误';
                        content += `填报失败, 错误信息: ${msg.msg}`
                    } else {
                        content += '填报成功';
                    }
                    content += '\n';
                }
                message = title + '\n\n' + content;
            }
            bot.sendMessage(telegramBotOptions.chatId, message.trim());
            console.log(`[PUSH-Telegram] Push success for user ${username}.`);
        } catch (e) {
            console.log(`[PUSH-Telegram] Failed to send message for ${username}.`);
            console.log(e);
        }
    }
}

class notification {
    constructor(settings) {
        this.handlers = [];
        this.eventsUpdate = settings.events.update;
        this.eventsError = settings.events.error;
        if (settings.serverChan.enable) {
            this.handlers.push(createServerChan(settings.serverChan));
        }
        if (settings.telegramBot.enable) {
            this.handlers.push(createTelegramBot(settings.telegramBot));
        }
        this.autoSummary = settings.autoSummary.enable;
        this.autoSummaryInterval = settings.autoSummary.interval;
        this.messageQueue = [];
        this.timeoutObj = null;
    }

    handleMessage(type, mode, status, username, msg) {
        if (this.autoSummary) {
            this.messageQueue.push({
                type,
                mode,
                status,
                username,
                msg
            });
            clearTimeout(this.timeoutObj);
            this.timeoutObj = setTimeout(() => {
                this.sendSummaryMessage();
            }, this.autoSummaryInterval * 1000);
        } else {
            this.sendSingleMessage(type, mode, status, username, msg);
        }
    }

    sendSingleMessage(type, mode, status, username, msg) {
        for (const handler of this.handlers) {
            if (status && this.eventsUpdate || !status && this.eventsError) {
                handler(type, mode, status, username, msg);
            }
        }
    }

    sendSummaryMessage() {
        const data = _.cloneDeep(this.messageQueue);
        this.messageQueue = [];
        for (const handler of this.handlers) {
            handler(data);
        }
    }
}

module.exports = notification;