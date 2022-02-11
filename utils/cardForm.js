const moment = require('moment');

function mergePreset(preset, userData) {
    userData.phone = preset.phone;
    userData.city = preset.city;
    userData.area = preset.area;
    userData.province = preset.province;
    userData.cityName = preset.cityName;
    userData.areaName = preset.areaName;
    userData.provinceName = preset.provinceName;
    userData.inCountry = preset.inCountry;
    if (preset.inCountry == '1') {
        userData.inProvince = preset.inProvince;
        userData.inCity = preset.inCity;
        userData.inArea = preset.inArea;
        userData.inProvinceName = preset.inProvinceName;
        userData.inCityName = preset.inCityName;
        userData.inAreaName = preset.inAreaName;
        userData.detailAdress = "";
    } else {
        userData.inProvince = "";
        userData.inCity = "";
        userData.inArea = "";
        userData.inProvinceName = "";
        userData.inCityName = "";
        userData.inAreaName = "";
        userData.detailAdress = preset.detailAdress;
    }
    userData.offLive = preset.offLive;
    if (preset.offLive == "1") {
        userData.offDate = moment(preset.offDate).format('YYYY-MM-DD');
        userData.arriveDate = moment(preset.arriveDate).format('YYYY-MM-DD');
        userData.route = preset.route;
        userData.travelType = preset.travelType;
        userData.flightOrCarNumber = preset.flightOrCarNumber;
    }
    userData.liveRisk = preset.liveRisk;
    userData.inLiveTwoWeek = preset.inLiveTwoWeek;
    userData.isIsolation = preset.isIsolation;
    userData.isInfect = preset.isInfect;
    userData.isCloseContact = preset.isCloseContact;
    userData.outLiveTwoWeek = preset.outLiveTwoWeek;
    userData.inVillageThreeWeek = preset.inVillageThreeWeek;
    userData.amTemperature = preset.amTemperature;
    userData.noonTemperature = preset.noonTemperature;
    userData.pmTemperature = preset.pmTemperature;
}

module.exports = {mergePreset}