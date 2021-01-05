const des = require('./3des');
const request = require('request');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';

class ujnsso {
    constructor(username, password, service) {
        this._username = username;
        this._password = password;
        this._service = service;
        this._jar = request.jar();
        this._lt = "";
    }
    getLT() {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://sso.ujn.edu.cn/tpass/login',
                method: 'GET',
                jar: this._jar,
                qs: {
                    service: this._service
                }
            }, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body.match(/"(LT-.+-tpass)"/)[1]);
                }
            });
        });
    }
    login() {
        return this.getLT().then((lt) => {
            this._lt = lt;
            return new Promise((resolve, reject) => {
                let c = des.enc(this._username + this._password + this._lt, '1', '2', '3');
                request({
                        url: 'http://sso.ujn.edu.cn/tpass/login',
                        method: 'POST',
                        jar: this._jar,
                        qs: {
                            service: this._service,
                        },
                        form: {
                            rsa: c,
                            ul: this._username.length,
                            pl: this._password.length,
                            lt: this._lt,
                            execution: 'e1s1', // Which means 1st attempt and the 1st time access
                            _eventId: 'submit',
                        },
                        headers: {
                            'User-Agent': UA
                        }
                    },
                    (err, res) => {
                        if (err) {
                            reject(err);
                        } else {
                            if (res.statusCode == 200) {
                                reject(new Error('Failed to login.'));
                            } else if (res.statusCode == 302) {
                                resolve(res.headers.location);
                            }
                        }
                    }
                );
            }).then((location) => {
                return new Promise((resolve, reject) => {
                    request({
                        url: location,
                        jar: this._jar
                    }, (err, res) => {
                        if (err) {
                            reject(err);
                        } else {
                            if (res.statusCode == 200) {
                                resolve(true);
                            } else {
                                reject(new Error('Failed to get into the service.'));
                            }
                        }
                    });
                });
            });
        });
    }
}

module.exports = ujnsso;