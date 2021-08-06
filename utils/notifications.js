const UA = 'UJN Temperature Bot/1.0';
const express = require('express');
const request = require('request-promise');
const telegramBot = require('node-telegram-bot-api');

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
            let title = '';
            let content = '';
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
            let data = JSON.parse(await send(title, content));
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
            let message = '';
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
            bot.sendMessage(telegramBotOptions.chatId, message);
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
    }

    handleMessage(type, mode, status, username, msg) {
        for (const handler of this.handlers) {
            if (status && this.eventsUpdate || !status && this.eventsError) {
                handler(type, mode, status, username, msg);
            }
        }
    }
}

module.exports = notification;