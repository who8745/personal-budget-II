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

async function getEdit(req, res) {
    const client = new Client({
        connectionString,
    });

    const obj = req.params;

    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.category]);

    await client.end();

    res.render('pages/Edit', {envelope: clientData.rows[0]});
}

async function getDelete(req, res) {
    const client = new Client({
        connectionString,
    });

    const obj = req.params;

    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.category]);

    await client.end();

    res.render('pages/Delete', {envelope: clientData.rows[0]});
}

async function postDelete(req, res) {
    const client = new Client({
        connectionString,
    });

    await client.connect();

    const Total = await client.query('SELECT * FROM my_envelopes WHERE name = $1', ['Total']);
    let totalLimit = Total.rows[0].envelope_limit;
    let totalTransfer = Total.rows[0].transfer_amount;

    console.log(req.params);

    const obj = req.params;

    if(obj.id == "Total"){
        res.send("You can't delete the total amount");
    }else{
        const found = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.id]);

        console.log(found.rows[0]);

        console.log(found.rows[0].envelope_limit);

        totalLimit += found.rows[0].envelope_limit;
        totalTransfer = totalLimit;

        const deleted = await client.query('DELETE FROM my_envelopes WHERE name = $1', [found.rows[0].name]);
    
        const update = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [totalLimit, totalTransfer, 'Total']
        );

        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');
        
        client.end();

        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

async function postCreate(req, res) {
    const client = new Client({
        connectionString,
    });

    await client.connect();


    const Total = await client.query('SELECT * FROM my_envelopes WHERE name = $1', ['Total']);
    let totalLimit = Total.rows[0].envelope_limit;
    let totalTransfer = Total.rows[0].transfer_amount;

    const data = req.body;
    const category = data.Category.toLowerCase();
    const limit = data.Limit;
    const transfer = data.Transfer;

    const name = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [category]);

    if(limit > totalLimit){
        res.send("You've ran out of money. T_T");
    }else if(name != null){
        res.send("Envelope name is already in use.");
    }else{
        totalLimit -= limit;
        totalTransfer -= limit;

        const insert = await client.query('INSERT INTO my_envelopes(name, envelope_limit, transfer_amount) VALUES($1, $2, $3)',
            [category, limit, transfer]
        );

        const update = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [totalLimit, totalTransfer, 'Total']
        );

        client.end();

        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}


module.exports = {
    getAll, getOne, getEdit, getDelete, postCreate, postDelete
}