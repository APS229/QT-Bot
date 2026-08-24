'use strict';

const fs = require('fs');

class Database {
    constructor() {
        this.path = './database/settings';
    }

    create(serverId, gameChannel, manager) {
        const path = `${this.path}/${serverId}.json`;

        const data = {
            id: serverId,
            gameChannel: gameChannel || '',
            manager: manager || ''
        };

        try {
            fs.writeFileSync(path, JSON.stringify(data));
            return true;
        }
        catch (e) {
            console.error(e);
            return;
        }
    }

    query(serverId) {
        const path = `${this.path}/${serverId}.json`;
        try {
            if (!fs.existsSync(path)) this.create(serverId);

            return fs.readFileSync(path, 'utf8');
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
}

module.exports = new Database();