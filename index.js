#!/usr/bin/env node

process.env.TZ = 'Asia/Shanghai'

const CronJob = require('cron').CronJob;
const yargs = require('yargs');
const {
    hideBin
} = require('yargs/helpers')

const ehall = require('./reportMethods/ehall');
const fanxiaoSSO = require('./reportMethods/fanxiaoSSO');
const fanxiaoWeChat = require('./reportMethods/fanxiaoWeChat');
const config = require('./utils/config');
const users = require('./utils/users');

const argv = yargs(hideBin(process.argv))
    .command('init', 'Initial config file', (argv) => {
        try {
            console.log('Initializing config file.');
            config.init();
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .command('toggle <type> <status>', 'Toggle auto-report switch', (yargs) => {
        return yargs
            .positional('type', {
                describe: 'Report type to toggle with',
                type: 'string',
                choices: ['card', 'ehall']
            }).positional('status', {
                describe: 'Toggle on or off (true|false)',
                type: 'boolean'
            });
    }, (argv) => {
        try {
            console.log(`Toggle auto-repot switch for ${argv.type} ${argv.status == true?'On':'Off'}`);
            config.toggle(argv.type, argv.status);
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .command('list', 'List all users', (argv) => {
        try {
            let usersDB = new users();
            let data = usersDB.getAll();
            console.log('Type'.padEnd(8) + 'Username'.padEnd(34) + 'Status'.padEnd(10) + 'Mode'.padEnd(12) + 'Last Message'.padEnd(20));
            for (const val of data) {
                let msg = val.type.padEnd(8) + val.username.padEnd(34);
                if (val.card == false && val.card == false) {
                    msg += 'N/A'.padEnd(10);
                    msg += 'Disabled'.padEnd(12);
                } else {
                    if (val.lastUpdate.date == new Date().toISOString().split('T')[0]) {
                        if (val.lastUpdate.success) {
                            msg += 'OK'.padEnd(10);
                        } else {
                            msg += 'Failure'.padEnd(10);
                        }
                    } else {
                        msg += 'Waiting'.padEnd(10);
                    }
                    let mode = '';
                    if (val.card)
                        mode += 'card '
                    if (val.ehall)
                        mode += 'ehall'
                    msg += mode.padEnd(12);
                }
                msg += val.lastUpdate.msg.padEnd(20);
                console.log(msg);
            }
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .command('add-sso <username> <password> <name> <institute> <tel> <province> <city> <district> <alertLevel> <isAtSchool>', 'Add a sso user (Both Card and EHall)', (yargs) => {
        return yargs
            .positional('username', {
                describe: 'UJN SSO Username',
                type: 'string'
            })
            .positional('password', {
                describe: 'UJN SSO Password',
                type: 'string'
            })
            .positional('name', {
                describe: 'Real name',
                type: 'string'
            })
            .positional('institute', {
                describe: 'Current institute',
                type: 'string'
            })
            .positional('tel', {
                describe: 'Mobile Phone Number',
                type: 'string'
            })
            .positional('province', {
                describe: 'Hometown Province',
                type: 'string'
            })
            .positional('city', {
                describe: 'Hometown City',
                type: 'string'
            })
            .positional('district', {
                describe: 'Hometown District',
                type: 'string'
            })
            .positional('alertLevel', {
                describe: 'AlertLevel of Hometown',
                choices: ['低风险', '中风险', '高风险']
            })
            .positional('isAtSchool', {
                describe: 'Is at school',
                type: 'boolean'
            })
    }, (argv) => {
        try {
            let usersDB = new users();
            usersDB.insert('sso', argv);
            console.log(`SSO ${argv.username} created!`);
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .command('add-openid <openid>', 'Add a openid user (Card Only)', (yargs) => {
        return yargs
            .positional('openid', {
                describe: 'WeChat OpenID for UJN account',
                type: 'string'
            })
    }, (argv) => {
        try {
            let usersDB = new users();
            usersDB.insert('openid', {
                username: argv.openid,
                password: null
            });
            console.log(`OpenID ${argv.openid} created!`);
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .command('delete <username>', 'Delete user', (yargs) => {
        return yargs
            .positional('username', {
                describe: 'UJN SSO Username or OpenID',
                type: 'string'
            })
    }, (argv) => {
        try {
            let usersDB = new users();
            usersDB.deleteByID(argv.username);
            console.log(`User ${argv.username} deleted.`);
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .command('toggle-user <username> <type> <status>', 'Toggle user status', (yargs) => {
        return yargs
            .positional('username', {
                describe: 'UJN SSO Username or OpenID',
                type: 'string'
            })
            .positional('type', {
                describe: 'Report type to toggle with',
                type: 'string',
                choices: ['card', 'ehall']
            }).positional('status', {
                describe: 'Toggle on or off (true|false)',
                type: 'boolean'
            });
    }, (argv) => {
        try {
            let usersDB = new users();
            usersDB.toggle(argv.username, argv.type, argv.status);
            console.log(`Set ${argv.type} for user ${argv.username} to ${argv.status?"On":"Off"}`);
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .command('trigger <type> [target]', 'Report manually for all accounts failed today', (yargs) => {
        return yargs
            .positional('type', {
                describe: 'Report types',
                choices: ['ehall', 'card', 'all']
            })
            .positional('target', {
                describe: 'User ID (For single user, which will override types and status)',
                type: 'string'
            })
    }, (argv) => {
        try {
            let userDB = new users();
            let data;
            let queue = [];
            if (argv.target) {
                data = [userDB.getByID(argv.target)];
            } else {
                data = userDB.getByMode(argv.type);
            }
            for (const val of data) {
                if (val.lastUpdate.success != true && val.lastUpdate.date == new Date().toISOString().split('T')[0]) {
                    queue.push(val);
                }
            }
            // TODO Call auto report
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .argv

if (argv._.length == 0) {
    console.log('Starting auto-report.');
    let scheduledFanxiao = new CronJob(config.cron.card, async function () {
        console.log('Starting auto report for card.');
        let userDB = new users();
        let jobs = userDB.getByMode('card');
        for (const val of jobs) {
            if (val.type == 'openid') {
                let c = new fanxiaoWeChat(val.username);
                c.report();
            } else {
                let c = new fanxiaoSSO(val.username, val.password);
                c.report();
                //TODO Add callback to update database
            }
        }
    }, null, true, 'Asia/Shanghai');

    let scheduledEHall = new CronJob(config.cron.ehall, async function () {
        console.log('Starting auto report for ehall.');
        let userDB = new users();
        let jobs = userDB.getByMode('ehall');
        for (const val of jobs) {
            let e = new ehall(val.username, val.password, val.details);
            e.report();
            //TODO Add callback to update database
        }
    }, null, true, 'Asia/Shanghai');
}