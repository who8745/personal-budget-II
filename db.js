const pg = require('pg');
const {Client} = pg;

const connectionString = 'postgres://postgres:andyandy@localhost:5432/enveople_user';

async function testConnection(req, res) {

    let test;

    try {
        const client = new Client({
            connectionString,
        });
        await client.connect();
        test = true;
    } catch (error) {
        test = false
    }

    res.render('pages/Home', { test });
}

async function getAll(req, res) {
    const client = new Client({
        connectionString,
    });
    
    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

    await client.end();

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

async function getTransfer(req,res) {
    const client = new Client({
        connectionString,
    });
    
    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

    await client.end();

    res.render('pages/Transfer', {envelopes: clientData.rows});
}

async function postDelete(req, res) {
    const client = new Client({
        connectionString,
    });

    await client.connect();

    const Total = await client.query('SELECT * FROM my_envelopes WHERE name = $1', ['Total']);
    let totalLimit = Total.rows[0].envelope_limit;
    let totalTransfer = Total.rows[0].transfer_amount;

    const obj = req.params;

    if(obj.id == "Total"){
        res.send("You can't delete the total amount");
    }else{
        const found = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.id]);

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
    const category = data.Category;
    const limit = data.Limit;
    const transfer = data.Transfer;

    const name = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [category]);

    if(limit > totalLimit){
        res.send("You've ran out of money. T_T");
    }else if(name.rowCount > 0){
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

        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        client.end();

        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

async function postEdit(req, res) {

    const {id} = req.params;

    const client = new Client({
        connectionString,
    });

    await client.connect();


    const Total = await client.query('SELECT * FROM my_envelopes WHERE name = $1', ['Total']);
    let totalLimit = Total.rows[0].envelope_limit;
    let totalTransfer = Total.rows[0].transfer_amount;

    const data = req.body;

    console.log(data);

    const category = data.Category;
    let limit = data.Limit;
    let transfer = data.Transfer;

    limit = Number(limit);
    transfer = Number(transfer);

    const dbData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [id]);
    let dbLimit = Number(dbData.rows[0].envelope_limit);

    if(category !== "Total"){
        totalLimit += dbLimit;
            
        if(limit > totalLimit){
            totalLimit -= dbLimit;
            res.send("You've ran out of money. T_T");
        }else{
            if(transfer > limit){
                res.send("Transfer amount can't be more than it's limit.");
            }else{
                totalLimit -= limit;
                totalTransfer = totalLimit;

                const update = await client.query('UPDATE my_envelopes SET name = $1, envelope_limit = $2, transfer_amount = $3 WHERE name = $4',
                [category, limit, transfer, id]
                );

                const updateTotal = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
                    [totalLimit, totalTransfer, 'Total']
                );

                const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

                client.end();
        
                res.render('pages/Index', {envelopes: clientData.rows});
            }
        }
    }else{

        totalLimit = limit;
        totalTransfer = totalLimit;

        const updateTotal = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [totalLimit, totalTransfer, 'Total']
        );

        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        client.end();

        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

async function postTransfer(req, res) {
    const client = new Client({
        connectionString,
    });

    await client.connect();

    const from = req.body.from;
    const to = req.body.to;

    const fromData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [from]);
    const toData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [to]);

    

    if(fromData.rows[0].id == 1){
        res.send("You can't transer from total, please use the create page.");
    }else{
        toNewLimit = Number(toData.rows[0].envelope_limit) + Number(fromData.rows[0].transfer_amount);
        fromNewLimit = Number(fromData.rows[0].envelope_limit) - Number(fromData.rows[0].transfer_amount);
        
        toNewTransfer = Number(toData.rows[0].transfer_amount) + Number(fromData.rows[0].transfer_amount);
        fromNewTransfer = 0

        const updateTo = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [toNewLimit, toNewTransfer, to]
        );

        const updateFrom = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [fromNewLimit, fromNewTransfer, from]
        );

        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        client.end();

        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

module.exports = {
    getAll, 
    getOne, 
    getEdit, 
    getDelete, 
    getTransfer,
    postCreate, 
    postDelete, 
    postEdit, 
    postTransfer,
    testConnection
}