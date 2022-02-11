const fs = require('fs');
const _ = require('lodash');

// Basic form template for ehall
const ehallTemplate = {
    // 填报日期 留空即可
    TBRQ: '',
    // 我不知道这是做啥的 保留
    _t: 3,
    // 姓名
    XM: "",
    // 学号
    XH: "",
    // 学院
    SZXY: "",
    // 手机号
    SJH: "",
    // 地址部分不确定的话可以去看看智慧济大 或者调用ehall.getProvience()等函数
    // 这里两行都要填
    // 家庭所在省
    SHENG_TEXT: "",
    SHENG: "",
    // 家庭所在市
    SHI_TEXT: "",
    SHI: "",
    // 家庭所在区
    QU_TEXT: "",
    QU: "",
    // 国内还是国外
    GNGW_TEXT: "国内",
    GNGW: "国内",
    // 目前所在省
    MQS_TEXT: "",
    MQS: "",
    // 目前所在市
    MQSH_TEXT: "",
    MQSH: "",
    // 目前所在区
    MQQ_TEXT: "",
    MQQ: "",
    // 国外地址(选国外才写)
    GWDZ: "",
    // 是否离开居住地
    SFLKJZD: "否",
    // 离开时间
    LKSJ: "",
    // 到达时间
    DDSJ: "",
    // 路线
    LX: "",
    // 出行方式 这个也需要参考智慧济大
    CXFS_TEXT: "请选择",
    CXFS: "",
    // 车牌号
    CPH: "",
    // 08/03/2021新增
    // 目前所在地风险等级 有 低风险 中风险 高风险
    MQSZDFXDJ: "低风险",
    // 08/15/2021新增
    // 是否有本土疫情旅居史
    SFYBTYQLJS: "否",
    // 是否医学隔离
    SFYXGL: "否",
    // 发热情况 这个貌似是系统给填写的 分有 不发热 低热（37.3-38度） 中热(38.1-39度) 高热(39.1度以上)
    FRQK: "不发热",
    // 是否感染COVID-19
    SFGRXGFY: "否",
    // 感染类型 这个也要参考智慧济大
    GRLX_TEXT: "请选择",
    GRLX: "",
    // 本人或家庭是否为密切接触者
    BRHJTSFWMQJC: "否",
    // 14天内本人或家庭成员是否有中高风险地区旅居史、接触史
    ZGFXDQLXS: "否",
    // 21天内所居住社区是否发生疫情
    SQCJSFFSYQ: "否",
    // 体温部分留空 自动生成
    // 上午体温
    SWTW: "36.5",
    // 中午体温
    ZHWTW: "36.5",
    // 下午体温
    XWTW: "36.5",
    // 时间戳 留空即可
    SJC: "",
    // 下面不需要管
    _o: {
        TBRQ: null,
        XM: null,
        XH: null,
        SZXY: null,
        SJH: null,
        SHENG_TEXT: null,
        SHENG: null,
        SHI_TEXT: null,
        SHI: null,
        QU_TEXT: null,
        QU: null,
        GNGW_TEXT: null,
        GNGW: null,
        MQS_TEXT: null,
        MQS: null,
        MQSH_TEXT: null,
        MQSH: null,
        MQQ_TEXT: null,
        MQQ: null,
        GWDZ: null,
        SFLKJZD: null,
        LKSJ: null,
        DDSJ: null,
        LX: null,
        CXFS_TEXT: null,
        CXFS: null,
        CPH: null,
        MQSZDFXDJ: null,
        SFYBTYQLJS: null,
        SFYXGL: null,
        FRQK: null,
        SFGRXGFY: null,
        GRLX_TEXT: null,
        GRLX: null,
        BRHJTSFWMQJC: null,
        ZGFXDQLXS: null,
        SQCJSFFSYQ: null,
        SWTW: null,
        ZHWTW: null,
        XWTW: null,
        SJC: null
    }
}

function autoComplateDetails(val) {
    let data = _.cloneDeep(val);
    if (data.type == 'sso') {
        let craftedInfo = {
            XM: data.details.name,
            XH: data.username,
            SJH: data.details.tel,
            SZXY: data.details.institute,
            SHENG: data.details.province,
            SHENG_TEXT: data.details.province,
            SHI: data.details.city,
            SHI_TEXT: data.details.city,
            QU: data.details.district,
            QU_TEXT: data.details.district,
            MQSZDFXDJ: data.details.level,
        }
        if (data.details.isAtSchool) {
            craftedInfo.SFLKJZD = '是';
            craftedInfo.MQS_TEXT = '山东省';
            craftedInfo.MQS = '山东省';
            craftedInfo.MQSH_TEXT = '济南市';
            craftedInfo.MQSH = '济南市';
            craftedInfo.MQQ_TEXT = '市中区';
            craftedInfo.MQQ = '市中区';
        } else {
            craftedInfo.MQS_TEXT = data.details.province;
            craftedInfo.MQS = data.details.province;
            craftedInfo.MQSH_TEXT = data.details.city;
            craftedInfo.MQSH = data.details.city;
            craftedInfo.MQQ_TEXT = data.details.district;
            craftedInfo.MQQ = data.details.district;
        }
        data.details = {
            ...ehallTemplate,
            ...craftedInfo,
            ...data.details.override
        }
    }
    return data;
}

class users {
    constructor() {
        if (fs.existsSync('users.json')) {
            this.userDB = new Map();
            let users = JSON.parse(fs.readFileSync('users.json'));
            for (let i = 0; i < users.length; i++) {
                this.userDB.set(users[i].username, users[i]);
            }
        } else {
            this.userDB = new Map();
            this.commit();
        }
    }

    getAll() {
        const db = [];
        this.userDB.forEach((val) => {
            db.push(autoComplateDetails(val));
        });
        return db;
    }

    getByMode(mode) {
        const data = [];
        this.userDB.forEach((val) => {
            if (val[mode]) {
                data.push(autoComplateDetails(val));
            }
        });
        return autoComplateDetails(data);
    }

    getByID(id) {
        if (this.userDB.has(id)) {
            return autoComplateDetails(this.userDB.get(id));
        } else {
            throw new Error('No such user.');
        }
    }

    deleteByID(id) {
        if (this.userDB.has(id)) {
            this.userDB.delete(id);
            this.commit();
        } else {
            throw new Error('No such user');
        }
    }

    insert(type, details) {
        if (this.userDB.has(details.username))
            throw new Error('User already exists.');
        let entry = {
            ehall: type == 'sso' ? true : false,
            card: true,
            cardLeave: false,
            // Username in SSO or OpenID
            username: details.username,
            // null in openid
            password: details.password,
            // Type
            type: type,
            // null in openid method
            details: {},
            // Last update
            lastUpdate: {
                success: true,
                date: '1970-01-01',
                datetime: new Date().toISOString(),
                msg: 'Created'
            }
        };
        if (type == 'openid') {
            entry.password = null;
        } else {
            entry.details = {
                name: details.name,
                tel: details.tel,
                institute: details.institute,
                province: details.province,
                city: details.city,
                district: details.district,
                level: details.alertLevel,
                isAtSchool: details.isAtSchool,
                override: {}
            }
        }
        entry.detailsCard = {
            userId: 0,
            studentId: 0,
            phone: '0',
            // 是否使用默认表单 启用之后用户自己填写的则作为fallback
            useOnlinePreset: true,
            // 是否填写宿舍信息
            fillInDormData: false,
            // 是否使用存储在学校服务器上的数据
            dormOnlineData: false,
            // 宿舍校区 1 主校区北院 2 主校区南院 3 舜耕校区
            campus: '0',
            floor: '学1',
            roomNumber: '101',
            // 家乡所在省 均参考 http://fanxiao.ujn.edu.cn/views/wechat/page/area.json
            province: '370000',
            // 市
            city: '370100',
            // 区
            area: '370103',
            provinceName: '山东省',
            cityName: '济南市',
            areaName: '市中区',
            // 是否在国内 1 国内 2 国外
            inCountry: '1',
            // 当前所在省市区
            inProvince: '370000',
            inCity: '370100',
            inArea: '370103',
            inProvinceName: '山东省',
            inCityName: '济南市',
            inAreaName: '市中区',
            // 详细地址 在国外再填写
            detailAdress: '',
            // 是否离开所在地 1 是 2 否 ?这三小
            offLive: '2',
            offDate: '',
            arriveDate: '',
            // 路线
            route: '',
            // 出行方式 1 火车 2 长途汽车 3 飞机 4 自驾 5 其他
            travelType: '',
            // 出行方式相关信息 如车牌号等
            flightOrCarNumber: '',
            // 风险等级 3 低风险 2 中风险 1 高风险
            liveRisk: '3',
            // 14天内有无本土疫情 1 是 2 否
            inLiveTwoWeek: '2',
            // 是否隔离
            isIsolation: '2',
            // 是否感染
            isInfect: '2',
            // 是否密接
            isCloseContact: '2',
            // 14天内高风险地区旅居史/接触史
            outLiveTwoWeek: '2',
            // 21天社区是否有疫情
            inVillageThreeWeek: '2',
            // 纬度
            latitude: 36.61496,
            // 经度
            longitude: 116.97126
        }
        this.userDB.set(entry.username, entry);
        this.commit();
    }

    updateStatus(id, status, msg) {
        if (this.userDB.has(id)) {
            let data = _.cloneDeep(this.userDB.get(id));
            data.lastUpdate = {
                success: status,
                date: new Date().toISOString().split('T')[0],
                datetime: new Date().toISOString(),
                msg: msg
            }
            this.userDB.set(id, data);
            this.commit();
        } else {
            throw new Error('No such user.');
        }
    }

    toggle(id, type, status) {
        if (this.userDB.has(id)) {
            let user = _.cloneDeep(this.userDB.get(id));
            if (user.type == 'openid' && type == 'ehall') {
                throw new Error('EHall reporting is not available for openid users.');
            }
            user[type] = status;
            this.userDB.set(id, user);
            this.commit();
        } else {
            throw new Error('No such user.');
        }
    }

    commit() {
        const db = [];
        this.userDB.forEach((val) => {
            db.push(val);
        });
        fs.writeFileSync('users.json', JSON.stringify(db, null, 4));
    }
}

module.exports = users;