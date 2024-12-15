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

    //console.log(clientData.rows);

    res.render('pages/Index', {envelopes: clientData.rows});
}

async function getOne(req, res) {
    const client = new Client({
        connectionString,
    });

    const obj = req.params;
    
    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.category]);

    await client.end();

    //console.log(obj.category);
    //console.log(clientData.rows[0]);

    res.render('pages/Envelope', {envelope: clientData.rows[0]});
}

async function editGet(req, res) {
    const client = new Client({
        connectionString,
    });

    const obj = req.params;

    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.category]);

    await client.end();

    res.render('pages/Edit', {envelope: clientData.rows[0]});
}

module.exports = {
    getAll, getOne, editGet
}