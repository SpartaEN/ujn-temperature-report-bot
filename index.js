process.env.TZ = 'Asia/Shanghai'

const CronJob = require('cron').CronJob;

const ehall = require('./reportMethods/ehall');
const fanxiaoSSO = require('./reportMethods/fanxiaoSSO');
const fanxiaoWeChat = require('./reportMethods/fanxiaoWeChat');
const users = require('./users');

// Everyday at 6 p.m. auto report for fanxiao
let scheduledFanxiao = new CronJob('00 18 * * *', async function () {
    console.log('Starting auto report for card.');
    for (let user of users) {
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

// Everyday at 12 a.m. for ehall
let scheduledEHall = new CronJob('00 12 * * *', async function () {
    console.log('Starting auto report for ehall.');
    for (let user of users) {
        if (user.ehall) {
            let e = new ehall(user.username, user.password, user.details);
            e.report();
        }
    }
}, null, true, 'Asia/Shanghai');