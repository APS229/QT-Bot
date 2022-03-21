console.log(process.env.DATABASE_URL);

const { Client } = require('pg')
const client = new Client({user: 'postgres'})
client.connect(process.env.DATABASE_URL).then(() => console.log("Connected")).catch(console.log);