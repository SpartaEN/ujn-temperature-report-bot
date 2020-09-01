const request = require('request-promise');

const UA = "Mozilla/5.0 (Linux; Android 5.0; SM-N9100 Build/LRX21V) > AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 > Chrome/37.0.0.0 Mobile Safari/537.36 > MicroMessenger/6.0.2.56_r958800.520 NetType/WIFI";

class apiCaller {
    constructor(openid) {
        this.jar = request.jar();
        this.openid = openid;
    }
    login() {
        return request.get("https://fanxiao.ujn.edu.cn/wxUser/wxLoginByOpenId", {
            qs: {
                openId: this.openid
            },
            jar: this.jar,
            headers: {
                "User-Agent": UA
            }
        });
    }
    report() {
        let date = new Date();
        let reportDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
        return request.post("https://fanxiao.ujn.edu.cn/temperatureRecord/createTemperatureRecordCopy", {
            formData: {
                reportTime: reportDate,
                isOut: 2,
                address: "",
                travelMode: "",
                temperatureAm: 36.5,
                temperaturePm: 36.5,
                reserveOne: 36.5
            },
            jar: this.jar,
            headers: {
                "User-Agent": UA
            }
        });
    }
}

apiCaller.checkTime = (reportTime) => {
    let reportDate = new Date(reportTime);
    let currentDate = new Date();
    if (currentDate.getFullYear() == reportDate.getFullYear() && currentDate.getMonth() == reportDate.getMonth() && currentDate.getDate() == reportDate.getDate()) {
        return true;
    } else {
        return false;
    }
}

module.exports = apiCaller;