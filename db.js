//Import the postgres and set it to the var client
const pg = require('pg');
const {Client} = pg;

//The connection string to sign into the postgreSQL DB
const connectionString = 'postgres://postgres:andyandy@localhost:5432/enveople_user';

//Gets all the envelopes from the DB
async function getAllEnvelopes() {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });
    
    // Opens connection to the DB
    await client.connect();

    //Querys the DB for all envelopes and sorts them in ASC order
    const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

    //Closes the DB connection
    await client.end();

    //returns the query data
    return clientData;
}

//Gets a single envelope using a passed in object
async function getOneEnvelope(obj) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });
    
    // Opens connection to the DB
    await client.connect();

    //Query the DB for an envelope that matches the category of the passed in object
    const clientData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.category]);

    //Closes the DB connection
    await client.end();

    //returns the query data
    return clientData;
}

// Get a single transaction from a passed in object
async function getOneTransaction(obj) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });

    // Opens connection to the DB
    await client.connect();

    //query the DB for the transaction that matchs the id that the object has
    const foundTrans = await client.query('SELECT * FROM transactions WHERE id = $1', [obj.id]);

    //Closes the DB connection
    await client.end();

    //returns the query data
    return foundTrans;
}

// Function that test if the DB is connected
async function testConnection(req, res) {

    // pass/fail bool
    let test;

    // try if the connections works or errors out
    try {
        //Creates a new client and passes in the login info
        const client = new Client({
            connectionString,
        });

        // Opens connection to the DB
        await client.connect();

        // Set test to true to state that the connections works
        test = true;

        //Closes the DB connection
        await client.end();

    } catch (error) {

        // The connection error out, so test is set to false
        test = false
    }

    // render the Home page and passes in the test bool
    res.render('pages/Home', { test });
}

// render the index page and passes in all the envelopes
async function getAll(req, res) {
    const clientData = await getAllEnvelopes();

    res.render('pages/Index', {envelopes: clientData.rows});
}

// render the envelope page and passes in a single envelope
async function getOne(req, res) {
    const obj = req.params;

    const clientData = await getOneEnvelope(obj);

    res.render('pages/Envelope', {envelope: clientData.rows[0]});
}

// render the edit page and passes in a single envelope
async function getEdit(req, res) {
    const obj = req.params;

    const clientData = await getOneEnvelope(obj);

    res.render('pages/Edit', {envelope: clientData.rows[0]});
}

// render the delete page and passes in a single envelope
async function getDelete(req, res) {
    const obj = req.params;

    const clientData = await getOneEnvelope(obj);

    res.render('pages/Delete', {envelope: clientData.rows[0]});
}

// render the Transfer page and passes in the all envelopes
async function getTransfer(req,res) {
    const clientData = await getAllEnvelopes();

    res.render('pages/Transfer', {envelopes: clientData.rows});
}

// Delete an envelope from the DB upon a post request
async function postDelete(req, res) {

    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });

    // Opens connection to the DB
    await client.connect();

    // Query the DB for the envelope Total and info
    const Total = await client.query('SELECT * FROM my_envelopes WHERE name = $1', ['Total']);
    let totalLimit = Total.rows[0].envelope_limit;
    let totalTransfer = Total.rows[0].transfer_amount;

    // set the reqest params to a var
    const obj = req.params;

    // If the parmas id is total send a resonds blocking the post request
    if(obj.id == "Total"){
        res.send("You can't delete the total amount");
    }else{
        // query the DB and finds the envelope to delete
        const found = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [obj.id]);

        // Adds the envelope funds to the total
        totalLimit += found.rows[0].envelope_limit;
        totalTransfer = totalLimit;

        // delete the envelope
        const deleted = await client.query('DELETE FROM my_envelopes WHERE name = $1', [found.rows[0].name]);
    
        // update the total
        const update = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [totalLimit, totalTransfer, 'Total']
        );

        // Gets all remaining envelopes
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');
        
        //Closes the DB connection
        client.end();

        // render the Index page and passes in all envelopes
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

// Creates a new envelope from a post request
async function postCreate(req, res) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });

    // Opens connection to the DB
    await client.connect();

    // Query the DB for the envelope Total and info
    const Total = await client.query('SELECT * FROM my_envelopes WHERE name = $1', ['Total']);
    let totalLimit = Total.rows[0].envelope_limit;
    let totalTransfer = Total.rows[0].transfer_amount;

    // gets the request body and sets it's fields to vars
    const data = req.body;
    const category = data.Category;
    const limit = data.Limit;
    const transfer = data.Transfer;

    // query the DB to see if envelope already has that name
    const name = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [category]);

    // Checks that the new envelope limit is less then the remaining amount that total has
    if(limit > totalLimit){
        res.send("You've ran out of money. T_T");
    }else if(name.rowCount > 0){
        res.send("Envelope name is already in use.");
    }else{
        // Takes funds from total
        totalLimit -= limit;
        totalTransfer -= limit;

        // insert the new envelope into the DB
        const insert = await client.query('INSERT INTO my_envelopes(name, envelope_limit, transfer_amount) VALUES($1, $2, $3)',
            [category, limit, transfer]
        );

        // updates the total limit
        const update = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [totalLimit, totalTransfer, 'Total']
        );

        // gets all envelopes from the DB
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        //Closes the DB connection
        client.end();

        // render the index page with the passed in envelopes
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

// post code for the envelope edit page
async function postEdit(req, res) {

    // get the envelope id
    const {id} = req.params;

    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });

    // Opens connection to the DB
    await client.connect();

    // query for the total info and set it to var
    const Total = await client.query('SELECT * FROM my_envelopes WHERE name = $1', ['Total']);
    let totalLimit = Total.rows[0].envelope_limit;
    let totalTransfer = Total.rows[0].transfer_amount;

    // get the request body data from the page and set it to var
    const data = req.body;
    const category = data.Category;
    let limit = data.Limit;
    let transfer = data.Transfer;

    // make sure that they limit and transfer are number, IDK why this was needed to this page
    limit = Number(limit);
    transfer = Number(transfer);

    // query for the data for envelope that will be edited
    const dbData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [id]);
    let dbLimit = Number(dbData.rows[0].envelope_limit);

    // if code is for non-total editing, else code for total editing
    if(category !== "Total"){

        // adds the old envelope's limit to the total
        totalLimit += dbLimit;
            
        // checks if the edited limit is more than the total's
        if(limit > totalLimit){
            totalLimit -= dbLimit;
            res.send("You've ran out of money. T_T");
        }else{

            // Checks that the transfer amount is less then it's limit
            if(transfer > limit){
                res.send("Transfer amount can't be more than it's limit.");
            }else{

                // edits the total limit and how much it can transfer
                totalLimit -= limit;
                totalTransfer = totalLimit;

                // update the envelope in the DB
                const update = await client.query('UPDATE my_envelopes SET name = $1, envelope_limit = $2, transfer_amount = $3 WHERE name = $4',
                [category, limit, transfer, id]
                );

                // update the total in the DB
                const updateTotal = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
                    [totalLimit, totalTransfer, 'Total']
                );

                // get all the envelopes
                const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

                // Closes the DB connection
                client.end();
        
                // renders the index page with all the envelopes
                res.render('pages/Index', {envelopes: clientData.rows});
            }
        }
    }else{

        // Edits the total limit and transfer with the new data
        totalLimit = limit;
        totalTransfer = totalLimit;

        // update the total in the DB
        const updateTotal = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [totalLimit, totalTransfer, 'Total']
        );


        // get all the envelopes
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        // Closes the DB connection
        client.end();

        // renders the index page with all the envelopes
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

// code for the post transfer page
async function postTransfer(req, res) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });

    // Opens connection to the DB
    await client.connect();

    // get the to and from names from the transfer quest page
    const from = req.body.from;
    const to = req.body.to;

    // query the DB for the data related to the to and from data
    const fromData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [from]);
    const toData = await client.query('SELECT * FROM my_envelopes WHERE name = $1', [to]);

    // checks to see if they seleted total
    if(fromData.rows[0].id == 1){
        res.send("You can't transer from total, please use the create page.");
    }else{

        // set the new limits for the to and from envelopes into vars
        toNewLimit = Number(toData.rows[0].envelope_limit) + Number(fromData.rows[0].transfer_amount);
        fromNewLimit = Number(fromData.rows[0].envelope_limit) - Number(fromData.rows[0].transfer_amount);
        
        // set the new transfer amounts for the to and from envelopes into vars
        toNewTransfer = Number(toData.rows[0].transfer_amount) + Number(fromData.rows[0].transfer_amount);
        fromNewTransfer = 0

        // update the to envelope in the DB
        const updateTo = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [toNewLimit, toNewTransfer, to]
        );

        // update the from envelope in the DB
        const updateFrom = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE name = $3',
            [fromNewLimit, fromNewTransfer, from]
        );

        // query for all the envelopes
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        //Closes the DB connection
        client.end();

        // renders the index page with all the envelopes
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

// Gets alll the transactions for an envelope and renders the tranactions page
async function getAllTrans(req, res) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });
    
    //set the request params to an obj var
    let obj = req.params;

    // Opens connection to the DB
    await client.connect();

    // get the transactions for a single envelope
    const clientData = await client.query('SELECT transactions.id, transactions.recipient, transactions.payment_amount, transactions.date_sent, transactions.envelope_id FROM transactions JOIN my_envelopes ON transactions.envelope_id = my_envelopes.id WHERE my_envelopes.name = $1 ORDER BY transactions.date_sent ASC', [obj.category]);

    // gets the envelope id to pass into the create page params
    const env_id = await client.query('SELECT my_envelopes.id FROM my_envelopes WHERE my_envelopes.name = $1', [obj.category]);

    //Closes the DB connection
    await client.end();

    //  render the transactions page with the transactions for an envelope, and set the parmas for the create page link
    res.render('pages/Transactions', {transactions: clientData.rows, id: env_id.rows[0].id});
}

// Gets the data for a single transaction and passes it into the tranaction page
async function getOneTrans(req, res) {
    let obj = req.params;

    const foundTrans = await getOneTransaction(obj);

    res.render('pages/Transaction', {trans: foundTrans.rows[0]});
}

// gets the transaction create page and passes into the envelope id
async function getCreateTrans(req, res) {    
    let obj = req.params;

    res.render('pages/TransactionsCreate', {id: obj.id});
}

// gets the transaction and passes it into the edit page
async function getEditTrans(req, res) {
    let obj = req.params;

    const foundTrans = await getOneTransaction(obj);

    res.render('pages/TransactionsEdit', {trans: foundTrans.rows[0]});
}

// gets the transaction and passes it into the delete page
async function getDeleteTrans(req, res) {
    let obj = req.params;

    const foundTrans = await getOneTransaction(obj);

    res.render('pages/TransactionsDelete', {trans: foundTrans.rows[0]});
}

// post code for the create tranaction page
async function postCreateTrans(req, res) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });
    
    // gets the request body and set it to a var
    let obj = req.body;

    // Opens connection to the DB
    await client.connect();

    // query the DB for the envelope that this is a transaction for
    const envData = await client.query('SELECT * FROM my_envelopes WHERE my_envelopes.id = $1', [obj.id]);

    //Check if the envelope has enough money for the transaction
    if(envData.rows[0].envelope_limit < obj.Payment){
        res.send("You've ran out of money for this envelope. T_T");
    }else{
        // get the new limit and transer for the envelope
        let newLimit = envData.rows[0].envelope_limit - obj.Payment;
        let newtransfer = envData.rows[0].transfer_amount;

        // checks if the transfer amount needs to be lowered
        if(newLimit < newtransfer){
            newtransfer = newLimit
        }


        // update the envelope in the DB
        const update = await client.query('UPDATE my_envelopes SET name = $1, envelope_limit = $2, transfer_amount = $3 WHERE id = $4',
            [envData.rows[0].name, newLimit, newtransfer, obj.id]
            );

        // insert the transaction into the DB
        const transactionInsert = await client.query('INSERT INTO transactions (recipient, payment_amount, date_sent, envelope_id) VALUES($1, $2, CURRENT_TIMESTAMP, $3) ', [obj.Recipient, obj.Payment, obj.id]);
    
        // gets all envelopes from the DB
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        //Closes the DB connection
        await client.end();
    
        // render the index page and passes in the envelopes data
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

// post code for the edit transaction page
async function PostEditTrans(req, res) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });
    
    // gets the request body and params and sets them to vars
    let obj = req.body;
    let params = req.params;

    // Opens connection to the DB
    await client.connect();

    // query the DB for a single transaction
    const foundTrans = await client.query('SELECT * FROM transactions WHERE id = $1', [params.id]);

    // query the envelope data
    const envData = await client.query('SELECT * FROM my_envelopes WHERE my_envelopes.id = $1', [foundTrans.rows[0].envelope_id]);

    // get the limit for the total amount the envelope has
    let limit = envData.rows[0].envelope_limit + foundTrans.rows[0].payment_amount;

    // check the payment is less then the envelope's limit
    if(obj.Payment > limit){
        res.send("You've ran out of money for this envelope. T_T");
    }else{
        // set the vars for the new limits and transfer amounts
        let newLimit = limit - obj.Payment;
        let newtransfer = envData.rows[0].transfer_amount;

        // makes sure the limit is less than the transfer amount
        if(newLimit < newtransfer){
            newtransfer = newLimit
        }

        // update the envelope in the DB
        const update = await client.query('UPDATE my_envelopes SET name = $1, envelope_limit = $2, transfer_amount = $3 WHERE id = $4',
            [envData.rows[0].name, newLimit, newtransfer, foundTrans.rows[0].envelope_id]
            );

        // update the transaction in the DB
        const transactionUpdate = await client.query('UPDATE transactions SET recipient = $1, payment_amount = $2 WHERE id = $3', [obj.Recipient, obj.Payment, params.id]);
    
        //Querys the DB for all envelopes and sorts them in ASC order
        const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');

        //Closes the DB connection
        await client.end();
    
        // render the index page with the envelopes
        res.render('pages/Index', {envelopes: clientData.rows});
    }
}

// post code for the transaction delete page
async function postDeleteTrans(req, res) {
    //Creates a new client and passes in the login info
    const client = new Client({
        connectionString,
    });

    // Opens connection to the DB
    await client.connect();

    // get params and set it to a var
    const obj = req.params;

    // query the DB for the transaction to be delete
    const foundTrans = await client.query('SELECT * FROM transactions WHERE id = $1', [obj.id]);

    // query the DB for the transaction's envelope
    const foundEnv = await client.query('SELECT * FROM my_envelopes WHERE id = $1', [foundTrans.rows[0].envelope_id]);

    // get the new limit for the envelope
    const newLimit = foundTrans.rows[0].payment_amount + foundEnv.rows[0].envelope_limit;

    // delete the transaction from the DB
    const deleted = await client.query('DELETE FROM transactions WHERE id = $1', [foundTrans.rows[0].id]);

    // update the envelope in the DB
    const update = await client.query('UPDATE my_envelopes SET envelope_limit = $1, transfer_amount = $2 WHERE id = $3',
        [newLimit, foundEnv.rows[0].transfer_amount, foundTrans.rows[0].envelope_id]
    );

    //Querys the DB for all envelopes and sorts them in ASC order
    const clientData = await client.query('SELECT * FROM my_envelopes ORDER BY id ASC');
    
    //Closes the DB connection
    client.end();

    // render the index page with the envelopes
    res.render('pages/Index', {envelopes: clientData.rows});
}

// export the functions that the server need
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