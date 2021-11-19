const request = require('request-promise');
const moment = require('moment');

const UA = "Mozilla/5.0 (Linux; Android 5.0; SM-N9100 Build/LRX21V) > AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 > Chrome/37.0.0.0 Mobile Safari/537.36 > MicroMessenger/6.0.2.56_r958800.520 NetType/WIFI";

class fanxiaoWeChat {
    constructor(openid) {
        this._jar = request.jar();
        this._openid = openid;
        this._event_cb = (type, mode, status, username, msg) => {};
    }
    setEventCallback(cb) {
        this._event_cb = cb;
    }
    login() {
        return request.get("https://fanxiao.ujn.edu.cn/wxUser/wxLoginByOpenId", {
            qs: {
                openId: this._openid
            },
            jar: this._jar,
            headers: {
                "User-Agent": UA
            }
        });
    }
    submitTemperature() {
        return request.post("https://fanxiao.ujn.edu.cn/temperatureRecord/createTemperatureRecordCopy", {
            form: {
                reportTime: moment().format('YYYY-MM-DD'),
                isOut: 2,
                address: "",
                travelMode: "",
                temperatureAm: 36.5,
                temperaturePm: 36.5,
                reserveOne: 36.5
            },
            jar: this._jar,
            headers: {
                "User-Agent": UA,
                "X-Requested-With": "XMLHttpRequest"
            }
        });
    }
    async report() {
        try {
            let user = JSON.parse(await this.login());
            if (user.status != 1) {
                throw new Error(`Server responded with ${user.msg}`);
            }
            await this.submitTemperature();
            console.log(`[FanxiaoWechat] User ${this._openid} success.`);
            this._event_cb('openid', 'card', true, this._openid, 'OK');
        } catch (e) {
            console.log(`[FanxiaoWechat] User ${this._openid} report failed.`);
            console.log(e);
            this._event_cb('openid', 'card', false, this._openid, e.toString());
        }
    }
}

fanxiaoWeChat.checkTime = (reportTime) => {
    let reportDate = new Date(reportTime);
    let currentDate = new Date();
    if (currentDate.getFullYear() == reportDate.getFullYear() && currentDate.getMonth() == reportDate.getMonth() && currentDate.getDate() == reportDate.getDate()) {
        return true;
    } else {
        return false;
    }
}

module.exports = fanxiaoWeChat;