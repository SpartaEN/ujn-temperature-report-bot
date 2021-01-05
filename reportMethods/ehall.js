const ujnsso = require('./../utils/sso');
const ehallForm = require('./../utils/ehallForm');
const _ = require('lodash');
const request = require('request-promise');
const moment = require('moment');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';

const serviceId = '599a1e21-79aa-423f-aee9-4a18c9310f0b'
const refDataStoreId = 'c328a921-56aa-4aa4-afef-4db6a950';

function generateTemperature() {
    let num;
    // Just in case of our RNG breaks.
    do {
        num = Math.pow(-1, Math.round(Math.random())) * Math.floor(Math.random() * 3) / 10 + 36.5;
    } while (num < 36.2 || num > 36.8)
    return num;
}

function craftForm(baseData, data, dataStoreId) {
    data.TBRQ = moment().format('YYYY-MM-DD');
    data.SJC = new Date().getTime().toString();
    data.SWTW = generateTemperature();
    data.ZHWTW = generateTemperature();
    data.XWTW = generateTemperature();
    baseData.body.dataStores[dataStoreId].rowSet.primary.push(data);
    baseData.body.dataStores[dataStoreId].recordCount = 1;
    baseData.body.parameters.strUserId = "";
    baseData.body.parameters.strUserIdCC = "";
    baseData.body.parameters.nextActId = "";
    return baseData;
}

class ehall extends ujnsso {
    constructor(username, password, details) {
        super(username, password, 'http://ehall.ujn.edu.cn/fp/');
        this._information = _.cloneDeep(details);
    }
    checkService() {
        return request({
            url: 'http://ehall.ujn.edu.cn/fp/fp/serveapply/checkService',
            method: 'POST',
            jar: this._jar,
            json: {
                serveID: serviceId
            },
            headers: {
                'User-Agent': UA
            }
        }).then((body) => {
            return body == '0';
        });
    }
    getServiceDetails() {
        return request({
            url: 'http://ehall.ujn.edu.cn/fp/fp/serveapply/getServeApply',
            method: 'POST',
            jar: this._jar,
            json: {
                serveID: serviceId,
                from: 'hall'
            },
            headers: {
                'User-Agent': UA
            }
        });
    }
    getFormBase(formId, serviceId, process, privilegeId) {
        return request({
            url: 'http://ehall.ujn.edu.cn/fp/formParser',
            method: 'GET',
            jar: this._jar,
            qs: {
                status: 'select',
                formid: formId,
                service_id: serviceId,
                process: process,
                privilegeId: privilegeId
            },
            headers: {
                'User-Agent': UA
            }
        }).then((body) => {
            return body.match(/<script type="text\/tpl" id="dcstr">(.+)<\/script>/)[1];
        });
    }
    getCodeList(formId, type, parentType = null, parentValue = null) {
        let form = {
            formid: formId
        }
        if (parentType == null) {
            form.codelist_type = type;
        } else {
            form.codelist_parentType = parentType;
            form.codelist_parentValue = parentValue;
        }
        return request({
            url: 'http://ehall.ujn.edu.cn/fp/formParser',
            method: 'POST',
            jar: this._jar,
            qs: {
                status: 'codeList'
            },
            form: form,
            headers: {
                'User-Agent': UA
            }
        }).then((body) => {
            return JSON.parse(body);
        });
    }
    getProvience(formId) {
        return this.getCodeList(formId, 'area_province');
    }
    getCity(formId, provienceName) {
        return this.getCodeList(formId, '', 'area_province', provienceName);
    }
    getDistrict(formId, cityName) {
        return this.getCodeList(formId, '', 'area_city', cityName);
    }
    submitService(formId, process, payload) {
        return request({
            url: 'http://ehall.ujn.edu.cn/fp/formParser',
            method: 'POST',
            jar: this._jar,
            qs: {
                status: 'update',
                formid: formId,
                workflowAction: 'startProcess',
                seqId: '',
                workitemid: '',
                process: process
            },
            headers: {
                'User-Agent': UA,
                'Content-Type': 'text/plain;charset=UTF-8'
            },
            body: payload
        }).then((body) => {
            return JSON.parse(body);
        });
    }
    async report() {
        try {
            await this.login();
            if (!await this.checkService()) {
                throw new Error('Service unavailable.');
            }
            let serviceDetails = await this.getServiceDetails();
            let form = await this.getFormBase(serviceDetails.formID, serviceDetails.serveID, serviceDetails.procID, serviceDetails.privilegeId);
            let data = ehallForm.deserialize(form);
            let dataStoreId = Object.keys(data.body.dataStores)[0];
            /* IDK Whether the dataStoreId change everyday or just change when the form content changes. Comment anyway.
            if (dataStoreId != refDataStoreId) {
                throw new Error('DataStore ID seems changed, please double check your form.');
            }
            */
            data = craftForm(data, this._information, dataStoreId);
            form = ehallForm.serialize(data);
            let res = await this.submitService(serviceDetails.formID, serviceDetails.procID, form);
            if (res.SYS_PK && res.SYS_FK) {
                console.log(`[E-Hall] User ${this._username} success.`);
            } else {
                throw new Error(`Server responded with ${res}, report may failed.`);
            }
        } catch (e) {
            console.log(`[E-Hall] User ${this._username} failed:`);
            console.log(e);
        }
    }
}

module.exports = ehall;