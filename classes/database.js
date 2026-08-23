'use strict';

const fs = require('fs');

class Database {
    constructor() {
        this.path = './database/settings';
    }

    create(serverId) {
        const path = `${this.path}/${serverId}.json`;

        const data = {

        };

        fs.writeFileSync(path, JSON.stringify(data));
    }

    query(serverId) {
        const path = `${this.path}/${serverId}.json`;
        if (!fs.existsSync(path)) return;

        const data = require(path);
        console.log(data);
    }
}

module.exports = new Database();