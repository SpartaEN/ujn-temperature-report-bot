// Reference: http://ehall.ujn.edu.cn/fp/techcomp/form/runtime/dataCenter.js?v=1.12.2
function escapeString(str) {
    return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
    replace(/[\f]/g, '\\f').replace(/[\b]/g, '\\b').replace(/[\n]/g, '\\n').
    replace(/[\t]/g, '\\t').replace(/[\r]/g, '\\r');
}

function dataStoreToJSON(dataStore) {
    let result = [];
    result.push('rowSet:'.concat(rowSetToJSON(dataStore.rowSet)));
    result.push('name:"'.concat(dataStore.name).concat('"'));
    result.push('pageNumber:'.concat(dataStore.pageNumber));
    result.push('pageSize:'.concat(dataStore.pageSize));
    result.push('recordCount:'.concat(dataStore.recordCount));
    dataStore.rowSetName && result.push('rowSetName:"'.concat(dataStore.rowSetName).concat('"'));
    dataStore.order && result.push('order:"'.concat(dataStore.order).concat('"'));
    dataStore.conditionValues && result.push('conditionValues:'.concat(JSON.stringify(dataStore.conditionValues)));
    dataStore.parameters && result.push('parameters:'.concat(JSON.stringify(dataStore.parameters)));
    dataStore.metaData && result.push('metaData:'.concat(JSON.stringify(dataStore.metaData)));
    if (dataStore.statementName && dataStore.statementName != '') {
        dataStore.statementName && result.push('statementName:"'.concat(dataStore.statementName).concat('"'));
        dataStore.attributes && result.push('attributes:'.concat(JSON.stringify(dataStore.attributes)));
    } else {
        dataStore.condition && result.push('condition:"'.concat(dataStore.condition).concat('"'));
        dataStore.group && result.push('group:"'.concat(dataStore.group).concat('"'));
    }
    dataStore.pool && result.push('pool:"'.concat(dataStore.pool).concat('"'));
    dataStore.statistics && result.push('statistics:'.concat(JSON.stringify(dataStore.statistics)));
    dataStore.distinct && result.push('pool:'.concat(dataStore.distinct));
    return '{'.concat(result.join(',').concat('}'));
}

function rowSetToJSON(rowSet) {
    var result = [];
    result.push('{');
    result.push('"primary":'.concat(rowSetToBufJSON(rowSet.primary)));
    result.push(',');
    result.push('"filter":'.concat(rowSetToBufJSON(rowSet.filter)));
    result.push(',');
    result.push('"delete":'.concat(rowSetToBufJSON(rowSet.delete)));
    result.push('}');
    return result.join('');
}

function rowSetToBufJSON(rowSetElement) {
    // Modified just to cater for the auto temperature report, may not working well on other services
    let result = [],
        item, value;
    for (let i = 0, _o, data, key, record;(data = rowSetElement[i]); i++) {
        _o = data['_o'];
        delete data['_o'];
        record = [];
        for (key in data) {
            item = [];
            item.push('"');
            item.push(key);
            item.push('"');
            item.push(':');
            value = data[key];
            if (typeof value == 'string') {
                item.push(escapeString(value));
            } else {
                if (/\[object [oO]bject\]/.test(value)) {
                    item = [];
                } else {
                    item.push(value == null ? 'null' : value);
                }

            }
            item.length > 0 && record.push(item.join(''));
        }
        if (_o) {
            data['_o'] = _o;
            var dd = [];
            for (key in _o) {
                item = [];
                item.push('"');
                item.push(key);
                item.push('"');
                item.push(':');
                value = _o[key];
                if (typeof value == 'string') {
                    item.push(escapeString(value));
                } else {
                    item.push(value == null ? 'null' : value);
                }
                dd.push(item.join(''));
            }
            item = [];
            item.push('_o : {');
            item.push(dd.join(','));
            item.push('}');
            record.push(item.join(''));
        }
        item = [];
        item.push('{');
        item.push(record.join(','));
        item.push('}');
        result.push(item.join(''));
    }
    return '['.concat(result.join(',')).concat(']');
}

// Eval the JSON-like form
const deserialize = (data) => {
    return eval('(' + data + ')');
}

const serialize = (data) => {
    let store = [],
        body = [],
        result = [];
    result.push('{');
    result.push('header:');
    result.push(JSON.stringify(data.header));
    result.push(',');
    result.push('body:{');
    for (let dataStore in data.body.dataStores) {
        store.push(('"' + dataStore + '"').concat(':').concat(dataStoreToJSON(data.body.dataStores[dataStore])));
    }
    body.push('dataStores:{'.concat(store.join(',')).concat('}'));
    body.push('parameters:'.concat(JSON.stringify(data.body.parameters)));
    result.push(body.join(','));
    result.push('}}');
    return result.join('');
}

exports.deserialize = deserialize;
exports.serialize = serialize;