const ujnsso = require('./../utils/sso');
const request = require('request-promise');
const moment = require('moment');

const UA = "Mozilla/5.0 (Linux; Android 5.0; SM-N9100 Build/LRX21V) > AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 > Chrome/37.0.0.0 Mobile Safari/537.36 > MicroMessenger/6.0.2.56_r958800.520 NetType/WIFI";

class fanxiaoSSO extends ujnsso {
    constructor(username, password) {
        super(username, password, 'http://fanxiao.ujn.edu.cn/cas/index');
        this._event_cb = (type, mode, status, username, msg) => {};
    }
    setEventCallback(cb) {
        this._event_cb = cb;
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
            await this.login();
            await this.submitTemperature();
            console.log(`[FanxiaoSSO] User ${this._username} success.`);
            this._event_cb('sso', 'card', true, this._username, 'OK');
        } catch (e) {
            console.log(`[FanxiaoSSO] User ${this._username} failed:`);
            console.log(e);
            this._event_cb('sso', 'card', false, this._username, e.toString());
        }
    }
}

module.exports = fanxiaoSSO;