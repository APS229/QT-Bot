'use strict';

const fs = require('fs');

class Database {
    constructor() {
        this.path = './database/settings';
        this.cache = {};
        this.load();
    }

    load() {
        try {
            for (const filename of fs.readdirSync(this.path)) {
                const data = JSON.parse(fs.readFileSync(`${this.path}/${filename}`));
                this.cache[data.id] = data;
            }
        }
        catch (e) {
            console.error(e);
        }
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
            this.cache[serverId] = data;
            return true;
        }
        catch (e) {
            console.error(e);
            return;
        }
    }

    query(serverId) {
        if (this.cache[serverId]) return this.cache[serverId];

        const path = `${this.path}/${serverId}.json`;
        try {
            if (!fs.existsSync(path)) this.create(serverId);

            const data = JSON.parse(fs.readFileSync(path, 'utf8'));
            this.cache[serverId] = data;
            return data;
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
}

module.exports = new Database();