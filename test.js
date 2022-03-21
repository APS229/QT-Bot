console.log(process.env.DATABASE_URL);

const { Client } = require('pg')
const client = new Client({user: 'postgres'})
client.connect(process.env.DATABASE_URL)
client.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
  console.log(err ? err.stack : res.rows[0].message) // Hello World!
  client.end()
})