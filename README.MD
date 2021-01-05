# ujn-temperature-report-bot

济南大学自动报体温。

支持以下几种填报方式
 - 智慧济大办事大厅填报
 - 返校健康卡(单点登录)
 - 返校健康卡(微信OpenID )

# Requirements

- node.js

## optional

如果需要一个telegram bot来通知是否填报成功的话。

- mysql
- telegram bot

# Usage

Standalone:

- Copy `users.sample.js` to `users.js`
- npm install
- node index

Telegram Bot(Only support wechat method):

- Configure database with `tgBot.sql`
- Copy `config.sample.js` to `config.js` and configure the file.
- npm install
- node telegramBot

# Demo(telegram bot)

[@ujn_temperature_bot](https://t.me/ujn_temperature_bot)