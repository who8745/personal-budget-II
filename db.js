const pg = require('pg');
const {Client} = pg;

const connectionString = 'postgres://postgres:andyandy@localhost:5432/enveople_user';

async function getAllEnvelopes() {
    const client = new Client({
        connectionString,
    });
    
    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

    await client.end();

    return clientData;
}

async function getOneEnvelope(obj) {
    const client = new Client({
        connectionString,
    });
    
    await client.connect();

    const clientData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.category]);

    await client.end();

    return clientData;
}

async function getOneTransaction(obj) {
    const client = new Client({
        connectionString,
    });

    await client.connect();

    const foundTrans = await client.query('SELECT * FROM transactions WHERE id = $1', [obj.id]);

    await client.end();

    return foundTrans;
}

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
    const clientData = await getAllEnvelopes();

    res.render('pages/Index', {envelopes: clientData.rows});
}

async function getOne(req, res) {
    const obj = req.params;

    const clientData = await getOneEnvelope(obj);

    res.render('pages/Envelope', {envelope: clientData.rows[0]});
}

async function getEdit(req, res) {
    const obj = req.params;

    const clientData = await getOneEnvelope(obj);

    res.render('pages/Edit', {envelope: clientData.rows[0]});
}

async function getDelete(req, res) {
    const obj = req.params;

    const clientData = await getOneEnvelope(obj);

    res.render('pages/Delete', {envelope: clientData.rows[0]});
}

async function getTransfer(req,res) {
    const clientData = await getAllEnvelopes();

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

async function getAllTrans(req, res) {
    const client = new Client({
        connectionString,
    });
    
    let obj = req.params;

    await client.connect();

    const clientData = await client.query('SELECT transactions.id, transactions.recipient, transactions.payment_amount, transactions.date_sent, transactions.envelope_id FROM transactions JOIN my_envelopes ON transactions.envelope_id = my_envelopes.id WHERE my_envelopes.name = $1 ORDER BY transactions.date_sent ASC', [obj.category]);

    const env_id = await client.query('SELECT my_envelopes.id FROM my_envelopes WHERE my_envelopes.name = $1', [obj.category]);

    await client.end();

    res.render('pages/Transactions', {transactions: clientData.rows, id: env_id.rows[0].id});
}

async function getOneTrans(req, res) {
    let obj = req.params;

    const foundTrans = await getOneTransaction(obj);

    res.render('pages/Transaction', {trans: foundTrans.rows[0]});
}

async function getCreateTrans(req, res) {    
    let obj = req.params;

    res.render('pages/TransactionsCreate', {id: obj.id});
}

async function getEditTrans(req, res) {
    let obj = req.params;

    const foundTrans = await getOneTransaction(obj);

    res.render('pages/TransactionsEdit', {trans: foundTrans.rows[0]});
}

async function getDeleteTrans(req, res) {
    let obj = req.params;

    const foundTrans = await getOneTransaction(obj);

    res.render('pages/TransactionsDelete', {trans: foundTrans.rows[0]});
}

async function postCreateTrans(req, res) {
    const client = new Client({
        connectionString,
    });
    
    let obj = req.body;

    console.log(obj);

    await client.connect();

    const envData = await client.query('SELECT * FROM my_envelopes WHERE my_envelopes.id = $1', [obj.id]);

    if(envData.rows[0].envelope_limit < obj.Payment){
        res.send("You've ran out of money for this envelope. T_T");
    }else{
        let newLimit = envData.rows[0].envelope_limit - obj.Payment;
        let newtransfer = envData.rows[0].transfer_amount;

        if(newLimit < newtransfer){
            newtransfer = newLimit
        }


        const update = await client.query('UPDATE my_envelopes SET name = $1, envelope_limit = $2, transfer_amount = $3 WHERE id = $4',
            [envData.rows[0].name, newLimit, newtransfer, obj.id]
            );

        const transactionInsert = await client.query('INSERT INTO transactions (recipient, payment_amount, date_sent, envelope_id) VALUES($1, $2, CURRENT_TIMESTAMP, $3) ', [obj.Recipient, obj.Payment, obj.id]);
    
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        await client.end();
    
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

async function PostEditTrans(req, res) {
    const client = new Client({
        connectionString,
    });
    
    let obj = req.body;
    let params = req.params;

    console.log(obj);

    await client.connect();

    const foundTrans = await client.query('SELECT * FROM transactions WHERE id = $1', [params.id]);

    const envData = await client.query('SELECT * FROM my_envelopes WHERE my_envelopes.id = $1', [foundTrans.rows[0].envelope_id]);

    let limit = envData.rows[0].envelope_limit + foundTrans.rows[0].payment_amount;

    if(obj.Payment > limit){
        res.send("You've ran out of money for this envelope. T_T");
    }else{
        let newLimit = limit - obj.Payment;
        let newtransfer = envData.rows[0].transfer_amount;

        if(newLimit < newtransfer){
            newtransfer = newLimit
        }

        const update = await client.query('UPDATE my_envelopes SET name = $1, envelope_limit = $2, transfer_amount = $3 WHERE id = $4',
            [envData.rows[0].name, newLimit, newtransfer, foundTrans.rows[0].envelope_id]
            );

        const transactionUpdate = await client.query('UPDATE transactions SET recipient = $1, payment_amount = $2 WHERE id = $3', [obj.Recipient, obj.Payment, params.id]);
    
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        await client.end();
    
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

async function postDeleteTrans(req, res) {
    const client = new Client({
        connectionString,
    });

    await client.connect();

    const obj = req.params;

    const foundTrans = await client.query('SELECT * FROM transactions WHERE id = $1', [obj.id]);

    const foundEnv = await client.query('SELECT * FROM my_envelopes WHERE id = $1', [foundTrans.rows[0].envelope_id]);

    const newLimit = foundTrans.rows[0].payment_amount + foundEnv.rows[0].envelope_limit;

    const deleted = await client.query('DELETE FROM transactions WHERE id = $1', [foundTrans.rows[0].id]);

    const update = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE id = $3',
        [newLimit, foundEnv.rows[0].transfer_amount, foundTrans.rows[0].envelope_id]
    );

    const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');
    
    client.end();

    res.render('pages/Index', {envelopes: clientData.rows});
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
    testConnection,
    getAllTrans,
    getCreateTrans,
    getOneTrans,
    getEditTrans,
    getDeleteTrans,
    postCreateTrans,
    postDeleteTrans,
    PostEditTrans
}