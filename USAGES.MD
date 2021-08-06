# 济南大学体温填报使用指南

## 简单的安装与使用

### 需求

很简单，一台具有 Internet 访问并且一直在线的电脑。 (VPS/主机/容器均可，只要有Node.JS)

### 安装Node.JS

根据不同的 OS, Linux Distro 请自行搜索使用方法。

### 获取源码

通过 [https://github.com/SpartaEN/ujn-temperature-report-bot](https://github.com/SpartaEN/ujn-temperature-report-bot) 获取源码，建议使用 git ，方便升级。

### 安装依赖项

使用 command prompt/powershell/terminal，定位到源码目录，执行 `npm install` 即可。

### 使用

查看帮助 `node index --help`。

![初始化设置](https://i.loli.net/2021/08/06/2gHabht6mfvqs4K.png)

使用 `node index init` 初始化配置文件(可选，即使不执行的话也会自动初始化)。

使用 `node index list` 查看当前上报状态。

使用 `node index add-sso <username> <password> <name> <institute> <tel> <province> <city> <district> <alertLevel> <isAtSchool>` 添加一个用户。

比如我们要添加一个用户，学号 2019114514 密码 1qaz2wsx 姓名 李田所 野兽学院 手机 130000000000 山东省 济南市 历下区 低风险区 在家，则需要执行`node index add-sso 2019114514 1qaz2wsx 李田所 野兽学院 13000000000 山东省 济南市 历下区 低风险 false`即可。

同时我们需要设置下到底是报办事大厅还是返校健康卡，还是两者。

`node index toggle ehall true` 启用办事大厅填报。

`node index toggle card false` 禁用返校健康卡填报。

![Demo](https://i.loli.net/2021/08/06/LqUSYbMivsXepxr.png)

当然，这里还需要设置自动填报，执行 `node index` 即可，窗口不要关掉。对于 vps 来说可以使用 screen 或者写成systemd unit (init 用户试试 supervisor)，具体使用方法自行搜索。

注意: 调整全局设置、推送设置、时间设置需要重新启动自动填报才能生效！

## 进阶设置

### 设置消息推送

本项目提供两个推送方式:

- [Server酱 Turbo](https://sct.ftqq.com/)
- [TelegramBot](https://core.telegram.org/bots/api)

对用在 `config.json` 进行设置，没有该文件的可以运行 `node index init`。

```json
{
    "toggleCard": true,
    "toggleEHall": true,
    // 推送设置部分
    "notification": {
        "events": {
            // 在填报成功后即推送更新
            "update": true,
            // 在填报失败后即推送更新
            "error": true
        },
        // Server酱设置
        "serverChan": {
            // 是否启用Server酱
            "enable": false,
            // Server酱SendKey
            "key": "",
            // 代理设置 一般不需要
            "proxy": {
                "enable": false,
                "url": "socks5://127.0.0.1:1080"
            }
        },
        // Telegram机器人设置
        "telegramBot": {
            // 是否启用 Telegram机器人
            "enable": false,
            // 机器人 token
            "token": "",
            // ChatID
            "chatId": null,
            // WebHooks 相关设置 有需求可直接设置
            "webhooks": {
                "enable": false,
                // Express 监听地址
                "addr": "0.0.0.0",
                // Express 监听端口
                "port": 3000,
                // 机器人路径
                "path": "/",
                // 外部访问 URL
                "url": ""
            },
            // API URL 当网路问题的时候可自行搭建反向代理
            "baseApiUrl": "https://api.telegram.org"
        }
    },
    "cron": {
        "ehall": "00 14 * * *",
        "card": "00 18 * * *"
    }
}
```

Server酱使用方式如下
1. 使用微信注册Server酱
2. 在[https://sct.ftqq.com/sendkey](https://sct.ftqq.com/sendkey)获取SendKey
3. 设置消息通道为方糖服务号(也可根据个人需求进行设置)
4. 将开关打开，填写SendKey至配置中

TelegramBot使用方式如下
1. 找[@botfather](https://t.me/botfather)申请一个新的机器人
2. 将token填入，打开开关，并使用`node index`启用服务
3. 找到自己的bot，发送任意消息，机器人会发回chatId
4. 将chatId填入配置，重启服务，可再发送消息查看效果

填入前与填入后返回消息区别如下：
[TelegramBot](https://i.loli.net/2021/08/06/JRKEwOUthnHoSpG.png)

### 高级用户设置

我们支持两种认证方式
- SSO登入
- 微信OpenID登入(仅能上报返校健康卡 有大佬知道智慧济大 SSO 微信 openid (不是 code)登入的 endpoint 的话，欢迎提 PR)

均可通过 CLI 进行简单操作，也可通过直接编辑 `users.json`完成。

```json
[
    {
        // 对于单用户生效的两个填报开关
        "ehall": true,
        "card": true,
        // 智慧济大 SSO 用户名以及密码
        "username": "2019114514",
        "password": "1qaz2wsx",
        "type": "sso",
        "details": {
            // 办事大厅填报所需要的表项
            "name": "李田所",
            "tel": "13000000000",
            "institute": "野兽学院",
            "province": "山东省",
            "city": "济南市",
            "district": "历下区",
            "level": "低风险",
            // 这个给 true 的话 当前省市区则为学校 即 山东省 济南市 市中区
            "isAtSchool": false,
            // 覆盖项，在生成表单时，这里的项目会覆盖掉默认值与用户填写值，具体项目见 https://github.com/SpartaEN/ujn-temperature-report-bot/blob/master/utils/users.js#L5
            // 注释版 可能过时 https://github.com/SpartaEN/ujn-temperature-report-bot/blob/1e774de8659be744d739db27a8b0480ebc029b1d/users.sample.js#L11
            "override": {}
        },
        // 记录 尽量不要编辑
        "lastUpdate": {
            "success": true,
            "date": "1970-01-01",
            "datetime": "2021-08-06T03:21:42.444Z",
            "msg": "Created"
        }
    },
    {
        // OpenID的EHall不要开 没法用
        "ehall": false,
        "card": true,
        // 微信 openid
        "username": "abcdefghijklmnopqrst",
        "password": null,
        "type": "openid",
        "details": {},
        "lastUpdate": {
            "success": true,
            "date": "1970-01-01",
            "datetime": "2021-08-06T03:50:06.691Z",
            "msg": "Created"
        }
    }
]           
```

## 欢迎提交 PR

本项目还有很多不完善的地方，没啥大变动我是懒得做了，欢迎大佬提交 PR。
