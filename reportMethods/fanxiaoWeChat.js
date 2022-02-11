const request = require('request-promise');
const moment = require('moment');
const mergePreset = require('./../utils/cardForm').mergePreset;

const UA = "Mozilla/5.0 (Linux; Android 5.0; SM-N9100 Build/LRX21V) > AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 > Chrome/37.0.0.0 Mobile Safari/537.36 > MicroMessenger/6.0.2.56_r958800.520 NetType/WIFI";

class fanxiaoWeChat {
    constructor(openid) {
        this._jar = request.jar();
        this._openid = openid;
        this._event_cb = (type, mode, status, username, msg) => {};
        this._is_leave = false;
        this._leave_data = {};
        this._leave_form_settings = {
            useOnlinePreset: true,
            fillInDormData: false,
            dormOnlineData: false,
        }
    }
    setLeaveData(data) {
        this._is_leave = true;
        this._leave_data = data;
        this._leave_data.writeDate = moment().format('YYYY-MM-DD');
        this._leave_data.amTemperature = 36.5;
        this._leave_data.noonTemperature = 36.5;
        this._leave_data.pmTemperature = 36.5;
        this._leave_data.latitude = (this._leave_data.latitude + ((Math.floor(Math.random() * 3) - 1) * Math.floor(Math.random() * 2) / 100000)).toFixed(5);
        this._leave_data.longitude = (this._leave_data.longitude + ((Math.floor(Math.random() * 3) - 1) * Math.floor(Math.random() * 2) / 100000)).toFixed(5);
        // this._leave_data.latitude = this._leave_data.latitude + ((Math.floor(Math.random() * 3) - 1) * Math.floor(Math.random() * 10) / 100000);
        // this._leave_data.longitude = this._leave_data.longitude + ((Math.floor(Math.random() * 3) - 1) * Math.floor(Math.random() * 10) / 100000);
        this._leave_form_settings.useOnlinePreset = this._leave_data.useOnlinePreset;
        this._leave_form_settings.fillInDormData = this._leave_data.fillInDormData;
        this._leave_form_settings.dormOnlineData = this._leave_data.dormOnlineData;
        delete this._leave_data.useOnlinePreset;
        delete this._leave_data.fillInDormData;
        delete this._leave_data.dormOnlineData;
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
    submitTemperatureLeave() {
        return request.post("https://fanxiao.ujn.edu.cn/resultOffHealthyDay/addOffHealthyDay", {
            form: this._leave_data,
            jar: this._jar,
            headers: {
                "User-Agent": UA,
                "X-Requested-With": "XMLHttpRequest"
            }
        });
    }
    getDormData() {
        return request.post("https://fanxiao.ujn.edu.cn/studentRoom/getStudentRoom", {
            form: {
                studentId: this._leave_data.studentId
            },
            jar: this._jar,
            headers: {
                "User-Agent": UA,
                "X-Requested-With": "XMLHttpRequest"
            }
        });
    }
    getUserPreset() {
        return request.post("https://fanxiao.ujn.edu.cn/resultOffHealthyDay/getLastTimeMes", {
            form: {
                studentId: this._leave_data.studentId
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
            if (this._is_leave) {
                if (this._leave_form_settings.fillInDormData) {
                    if (this._leave_form_settings.dormOnlineData) {
                        let dormData = JSON.parse(await this.getDormData());
                        if (dormData.statusCode != 200) {
                            throw new Error("Failed to get dorm data: " + dormData.message);
                        }
                        if (dormData.data.studentRoom.isHave != 'yes') {
                            throw new Error("No dorm data stored on server, please submit at least once manually.");
                        }
                        this._leave_data.campus = dormData.data.studentRoom.room.campus;
                        this._leave_data.floor = dormData.data.studentRoom.room.floor;
                        this._leave_data.roomNumber = dormData.data.studentRoom.room.roomNumber;
                    }
                } else {
                    delete this._leave_data.campus;
                    delete this._leave_data.floor;
                    delete this._leave_data.roomNumber;
                }
                if (this._leave_data.offLive == '2') {
                    this._leave_data.offDate = moment().format('YYYY-MM-DD');
                    this._leave_data.arriveDate = moment().format('YYYY-MM-DD');
                }
                if (this._leave_form_settings.useOnlinePreset) {
                    let preset = JSON.parse(await this.getUserPreset());
                    if (preset.statusCode != 200) {
                        throw new Error("Failed to get preset data: " + dormData.message);
                    }
                    if (preset.data.lastTimeMes.isHave != 'yes') {
                        throw new Error("No preset data stored on server, please submit at least once manually.");
                    }
                    mergePreset(preset.data.lastTimeMes.healthyDay, this._leave_data);
                }
                let res = JSON.parse(await this.submitTemperatureLeave());
                if (res.statusCode != 200) {
                    throw new Error("Failed to submit temperature: " + res.message);
                }
                console.log(`[FanxiaoWechat-Leave] User ${this._openid} success.`);
                this._event_cb('openid', 'card-leave', true, this._openid, 'OK');
            } else {
                await this.submitTemperature();
                console.log(`[FanxiaoWechat] User ${this._openid} success.`);
                this._event_cb('openid', 'card', true, this._openid, 'OK');
            }
        } catch (e) {
            if (this._is_leave) {
                console.log(`[FanxiaoWechat-Leave] User ${this._openid} report failed.`);
                console.log(e);
                this._event_cb('openid', 'card-leave', false, this._openid, e.toString());
            } else {
                console.log(`[FanxiaoWechat] User ${this._openid} report failed.`);
                console.log(e);
                this._event_cb('openid', 'card', false, this._openid, e.toString());
            }
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