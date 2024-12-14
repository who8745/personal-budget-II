const pg = require('pg');
const {Pool, Client} = pg;

const connectionString = 'postgresql://envelope_user:RxKwknAoxGM8sfJ9Zeg1HPQDXWo8lSwC@dpg-ctcvi4dds78s739ld4kg-a.oregon-postgres.render.com/envelope_db_cvg3?ssl=true';



async function getAll(req, res) {
    const client = new Client({
        connectionString,
    });
    
    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

    await client.end();

    console.log(clientData.rows);

    res.render('pages/Index', {envelopes: clientData.rows});
}

module.exports = {
    getAll
}