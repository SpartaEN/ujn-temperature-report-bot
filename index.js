const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const api = require('./api');
const tasks = require('./model');
const express = require('express');

let queue = [];
let date = 0;

process.env.TZ = "Asia/Shanghai";

const bot = new TelegramBot(config.token, {
    polling: !config.webhooks.enable
});
const app = express();

app.use(express.json());

app.post(`/${config.webhooks.secret}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

if (config.webhooks.enable) {
    bot.setWebHook(config.webhooks.url + config.webhooks.secret);
    app.listen(config.webhooks.port, () => {
        console.log("WebHooks enabled.");
    });
}

async function updateTemperature(chatId, openId) {
    let API = new api(openId);
    try {
        let user = JSON.parse(await API.login());
        if (user.status == 1) {
            if (api.checkTime(user.temperatureRecord.updateTime)) {
                await bot.sendMessage(chatId, "No need to update.");
            } else if (new Date().getHours() < 18) {
                await bot.sendMessage(chatId, "Current time haven't passed 6 p.m., try again later.")
            } else {
                if (config.dryrun) {
                    bot.sendMessage(chatId, "[Dry-Run] The temperature won't be submitted under dry-run mode.");
                } else {
                    await API.report();
                }
            }
            let newUser = JSON.parse(await API.login());
            let record = newUser.temperatureRecord;
            await bot.sendMessage(chatId, `updateTime: ${record.updateTime} ${record.isHealth === 1? "Healthy":"Unhealthy"}`);
        } else {
            await bot.sendMessage(chatId, `Some problems with your account: ${response.msg}`);
        }
    } catch (e) {
        bot.sendMessage(chatId, "We're experiencing some problems while submitting your temperature.");
        console.log(e);
        bot.sendMessage(config.ownerId, e.toString());
    }
}

const HelpMessage = `Usage: 
/help Show help messages
/enable <WeChat OpenId> Enable auto temperature report
/disableAll Disablle all auto temperature report on your account
/disable <WeChat OpenId> Disablle specific auto temperature report on your account
/list List all tasks on your account
/trigger <WeChat OpenId> Trigger an update on specific openid
Getting WeChat openid https://blog.sparta-en.org/ujn-temperature-report-bot-usage/
NOTE: We don't store your personal information except your openId, which *can get all information associated* to the site. Proceed with your own risks. `

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, HelpMessage, {
        parse_mode: "Markdown"
    });
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, HelpMessage, {
        parse_mode: "Markdown"
    });
});

bot.onText(/\/ping/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Pong');
});

bot.onText(/\/enable (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const openId = match[1];
    if (typeof openId == 'string' && openId.length == 32) {
        try {
            let res = await tasks.getByOpenId(openId);
            if (res.length === 0) {
                let API = new api(openId);
                let response = JSON.parse(await API.login());
                if (response.status == 1) {
                    let task = tasks(chatId, openId);
                    await tasks.add(task);
                    bot.sendMessage(chatId, "Auto reporting will trigger automatically every 7 p.m., if you haven't submit your temperature and the server time has passed 7 p.m., please trigger maually.")
                } else {
                    bot.sendMessage(chatId, `Invalid openId ${response.msg}`);
                }
            } else {
                bot.sendMessage(chatId, "This openid has already in our system.");
            }
        } catch (e) {
            bot.sendMessage(chatId, "We're experiencing some problems.");
            console.log(e);
            bot.sendMessage(config.ownerId, e.toString());
        }
    } else {
        bot.sendMessage(chatId, "Not a valid uid, should be 32 characters length, if you are having problems with add your account, contact @Sparta_EN_MVS");
    }
});

bot.onText(/\/disable (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const openId = match[1];
    try {
        let res = await tasks.getByOpenId(openId);
        if (res[0].uid == chatId) {
            await tasks.delete(chatId, openId);
            bot.sendMessage(chatId, "Success.");
        } else {
            bot.sendMessage(chatId, "We can't find this openid.")
        }
    } catch (e) {
        bot.sendMessage(chatId, "We're experiencing some problems.");
        console.log(e);
        bot.sendMessage(config.ownerId, e.toString());
    }
});

bot.onText(/\/disableAll/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await tasks.deleteAll(chatId);
        bot.sendMessage(chatId, "Success.");
    } catch (e) {
        bot.sendMessage(chatId, "We're experiencing some problems.");
        console.log(e);
        bot.sendMessage(config.ownerId, e.toString());
    }
});

bot.onText(/\/list/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        let response = "";
        let res = await tasks.getByUid(chatId);
        for (let ele of res) {
            response += ele.openid + '\n';
        }
        response += `${res.length} rows.`;
        bot.sendMessage(chatId, response, {
            parse_mode: "Markdown"
        });
    } catch (e) {
        bot.sendMessage(chatId, "We're experiencing some problems.");
        console.log(e);
        bot.sendMessage(config.ownerId, e.toString());
    }
});

bot.onText(/\/trigger (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const openId = match[1];
    try {
        let res = await tasks.getByOpenId(openId);
        if (res.length !== 0 && res[0].uid == chatId) {
            updateTemperature(chatId, openId);
            bot.sendMessage(chatId, "Triggering your update.")
        } else {
            bot.sendMessage(chatId, "We can't find this openid.")
        }
    } catch (e) {
        bot.sendMessage(chatId, "We're experiencing some problems.");
        console.log(e);
        bot.sendMessage(config.ownerId, e.toString());
    }
});

bot.onText(/\/date/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, new Date().toString());
});

setInterval(() => {
    if (new Date().getDate() != date && new Date().getHours() >= 19) {
        date = new Date().getDate();
        (async () => {
            let data = await tasks.getAll();
            for (let single of data) {
                queue.push(single);
            }
        })()
    }
    if (queue.length != 0) {
        let task = queue.shift();
        updateTemperature(task.uid, task.openid);
    }
}, 10000);
