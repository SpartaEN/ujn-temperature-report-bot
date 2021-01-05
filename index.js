process.env.TZ = 'Asia/Shanghai'

const CronJob = require('cron').CronJob;

const ehall = require('./reportMethods/ehall');
const fanxiaoSSO = require('./reportMethods/fanxiaoSSO');
const fanxiaoWeChat = require('./reportMethods/fanxiaoWeChat');
const users = require('./users');

// Every day at 6 p.m.
let scheduled = new CronJob('00 18 * * *', async function () {
    console.log('Starting auto report.');
    for (let user of users) {
        if (user.ehall) {
            let e = new ehall(user.username, user.password, user.details);
            e.report();
        }
        if (user.card) {
            if (user.wechatOpenId !== false) {
                let c = new fanxiaoWeChat(user.wechatOpenId);
                c.report();
            } else {
                let c = new fanxiaoSSO(user.username, user.password);
                c.report();
            }
        }
    }
}, null, true, 'Asia/Shanghai');