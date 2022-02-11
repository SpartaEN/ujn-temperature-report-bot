# ujn-temperature-report-bot

济南大学自动报体温。

支持以下几种填报方式
 - 智慧济大办事大厅填报
 - 返校健康卡(单点登录)
 - 返校健康卡(微信OpenID)
 - 返校健康卡离校版(单点登录)
 - 返校健康卡离校版(微信OpenID)

 离校版由于某些问题关键信息只能手动获取, 参考 [#1](https://github.com/SpartaEN/ujn-temperature-report-bot/issues/1).

# Requirements

- node.js

## optional

如果需要知道是否填报成功的话:

- telegram bot
- ServerChan

# Usage

1. 安装node.js与npm
2. 执行npm install安装依赖
3. Enjoy!

- 执行node index --help以查看帮助
- 直接执行node index即开启自动填报

详细说明参考 [USAGES.MD](./USAGES.MD)
