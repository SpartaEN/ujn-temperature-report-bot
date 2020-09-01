const mysql = require('mysql');
const config = require('./config');
const connection = mysql.createConnection({
    host: config.database.addr,
    database: config.database.name,
    user: config.database.user,
    password: config.database.pass
})
const tasks = (uid, openid) => {
    const user = {
        uid: uid,
        openid: openid
    }
    return user;
}

tasks.add = (task) => {
    return new Promise((resolve, reject) => {
        connection.query("INSERT INTO tasks SET ?", task, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

tasks.delete = (uid, openid) => {
    return new Promise((resolve, reject) => {
        connection.query("DELETE FROM tasks WHERE uid = ? AND openid = ?", [uid, openid], (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

tasks.deleteAll = (uid) => {
    return new Promise((resolve, reject) => {
        connection.query("DELETE FROM tasks WHERE uid = ?", uid, (err, res) => {
            if (err) {
                reject (err);
            } else {
                resolve(res);
            }
        });
    });
}

tasks.getAll = () => {
    return new Promise((resolve, reject)=> {
        connection.query("SELECT * FROM tasks", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    });
}

tasks.getByUid = (uid) => {
    return new Promise((resolve, reject)=> {
        connection.query("SELECT * FROM tasks WHERE uid = ?", uid, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    });
}

tasks.getByOpenId = (openid) => {
    return new Promise((resolve, reject)=> {
        connection.query("SELECT * FROM tasks WHERE openid = ?", openid, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    });
}

module.exports = tasks;