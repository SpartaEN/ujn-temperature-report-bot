const fs = require('fs');

const defaultSettings = {
    toggleCard: true,
    toggleEHall: true,
    notification: {
        events: {
            update: false,
            error: true
        },
        autoSummary: {
            enable: false,
            interval: 60
        },
        serverChan: {
            enable: false,
            key: '',
            proxy: {
                enable: false,
                url: 'socks5://127.0.0.1:1080'
            }
        },
        telegramBot: {
            enable: false,
            token: '',
            chatId: 0,
            webhooks: {
                enable: false,
                addr: '0.0.0.0',
                port: 3000,
                path: '/',
                url: ''
            },
            baseApiUrl: 'https://api.telegram.org'
        }
    },
    cron: {
        ehall: '00 14 * * *',
        card: '00 18 * * *'
    }
};

let settings;

if (fs.existsSync('config.json')) {
    settings = {...defaultSettings, ...JSON.parse(fs.readFileSync('config.json'))};
} else {
    settings = defaultSettings;
    fs.writeFileSync('config.json', JSON.stringify(settings, null, 4));
}

settings.init = () => {
    fs.writeFileSync('config.json', JSON.stringify(defaultSettings, null, 4));
}

settings.toggle = (type, status) => {
    if (type == 'card') {
        settings.toggleCard = status;
    } else if (type == 'ehall') {
        settings.toggleEHall = status;
    }
    settings.save();
}

settings.save = () => {
    fs.writeFileSync('config.json', JSON.stringify(settings, null, 4));
}

module.exports = settings;