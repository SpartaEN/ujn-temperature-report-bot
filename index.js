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
const notifications = require('./utils/notifications');

function generateCallback(userDB, enablePush, pushService) {
    return function callback(type, mode, status, username, msg) {
        userDB.updateStatus(username, status, msg);
        if (enablePush) {
            pushService.handleMessage(type, mode, status, username, msg);
        }
    }
}

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
                if (val.card == false && val.ehall == false) {
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
            .option('force', {
                alias: 'f',
                describe: 'Force trigger update'
            })
    }, (argv) => {
        try {
            if (!argv.force) {
                console.log('NOTE: Only user marked as failed today will be updated, use --force to override.');
            }
            let userDB = new users();
            let data;
            if (argv.target) {
                data = [userDB.getByID(argv.target)];
            } else if (argv.type == 'all') {
                data = userDB.getAll();
            } else {
                data = userDB.getByMode(argv.type);
            }
            for (const val of data) {
                if (val.lastUpdate.success != true && val.lastUpdate.date == new Date().toISOString().split('T')[0] || argv.force) {
                    if (argv.type == 'all' || argv.type == 'ehall') {
                        let c = new ehall(val.username, val.password, val.details);
                        c.setEventCallback(generateCallback(userDB, false, undefined));
                        c.report();
                    }
                    if (argv.type == 'all' || argv.type == 'card') {
                        if (val.type == 'sso') {
                            let c = new fanxiaoSSO(val.username, val.password);
                            c.setEventCallback(generateCallback(userDB, true, undefined));
                            c.report();
                        } else {
                            let c = new fanxiaoWeChat(val.username, val.password);
                            c.setEventCallback(generateCallback(userDB, false, undefined));
                            c.report();
                        }
                    }
                }
            }
        } catch (e) {
            console.log(`${e.toString()}`);
        }
    })
    .argv

if (argv._.length == 0) {
    console.log('Starting auto-report.');
    const pushService = new notifications(config.notification);
    if (config.toggleCard) {
        console.log(`Add scheduler for card, ${config.cron.card}`)
        let scheduledFanxiao = new CronJob(config.cron.card, async function () {
            console.log('Starting auto report for card.');
            let userDB = new users();
            let jobs = userDB.getByMode('card');
            for (const val of jobs) {
                if (val.type == 'openid') {
                    let c = new fanxiaoWeChat(val.username);
                    c.setEventCallback(generateCallback(userDB, true, pushService))
                    c.report();
                } else {
                    let c = new fanxiaoSSO(val.username, val.password);
                    c.setEventCallback(generateCallback(userDB, true, pushService))
                    c.report();
                }
            }
        }, null, true, 'Asia/Shanghai');
    }
    if (config.toggleEHall) {
        console.log(`Add scheduler for ehall, ${config.cron.ehall}`)
        let scheduledEHall = new CronJob(config.cron.ehall, async function () {
            console.log('Starting auto report for ehall.');
            let userDB = new users();
            let jobs = userDB.getByMode('ehall');
            for (const val of jobs) {
                let e = new ehall(val.username, val.password, val.details);
                e.setEventCallback(generateCallback(userDB, true, pushService))
                e.report();
            }
        }, null, true, 'Asia/Shanghai');
    }
}