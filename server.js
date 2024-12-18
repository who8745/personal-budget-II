const express = require('express');
const bodyParse = require('body-parser');
const db = require('./db.js');

const app = express();

app.set('view engine', 'ejs');

let envelopes = [{
    Category: "Total",
    Limit: 2000,
    Transfer: 2000
}];

app.use(bodyParse.urlencoded({extended: true}));

app.get("/", (req, res) =>{
    db.getAll(req, res);
});

app.get("/envelopes", (req, res) =>{
    db.getAll(req, res);
});

app.get("/envelopes/:category", (req, res) =>{
    db.getOne(req, res);
});

app.get("/envelopes/edit/:category", (req, res) =>{

    db.getEdit(req, res);
});

app.get("/envelopes/delete/:category", (req, res) =>{
    const {category} = req.params;

    const foundCategory = envelopes.find((cat) => cat.Category === category);

    res.render('pages/Delete', {envelope: foundCategory});;
});

app.get("/transfer", (req, res) =>{

    res.render('pages/Transfer', {envelopes: envelopes});;
});

app.get("/Create", (req, res) =>{
    res.render('pages/Create');
});

app.post("/Create", (req, res) =>{
    /*
    const totalLimit = envelopes[0].Limit;
    const data = req.body;
    const limit = data.Limit;

    if(limit > totalLimit){
        res.send("You've ran out of money. T_T");
    }else{
        envelopes[0].Limit -= limit;
        envelopes[0].Transfer -= limit;
        envelopes.push(req.body);
        res.render('pages/Index', {envelopes: envelopes});
    }
    */

    db.postCreate(req, res);
});

app.post("/envelopes/:id", (req, res) =>{
    const {id} = req.params;

    if( id !== "Total"){
        const totalLimit = envelopes[0].Limit;
        const foundIndex = envelopes.findIndex((cat) => cat.Category === id);

        envelopes[0].Limit += Number(envelopes[foundIndex].Limit);

        const data = req.body;
        const limit = data.Limit;

    
        if(limit > totalLimit){
            envelopes[0].Limit -= envelopes[foundIndex].Limit
            res.send("You've ran out of money. T_T");
        }else{
            if(envelopes[foundIndex].Transfer > envelopes[foundIndex].Limit){
                res.send("Transfer amount can't be more than it's limit");
            }else{
                envelopes[0].Limit -= limit;
                envelopes[0].Transfer = envelopes[0].Limit;
                envelopes[foundIndex].Category = data.Category;
                envelopes[foundIndex].Limit = data.Limit;
                envelopes[foundIndex].Transfer = data.Transfer;

                res.render('pages/Index', {envelopes: envelopes});
            }
            
        }
    }else{
        const data = req.body;
        const newLimit = data.Limit;
        envelopes[0].Limit = newLimit;
        envelopes[0].Transfer = envelopes[0].Limit;
        res.render('pages/Index', {envelopes: envelopes});
    }
});

app.post("/delete/:id", (req, res) =>{
    const {id} = req.params;

    if(id === "Total"){
        res.send("You can't Delete the total amount");
    }else{
        const foundCategory = envelopes.find((cat) => cat.Category === id);
        envelopes[0].Limit += Number(foundCategory.Limit);
        envelopes[0].Transfer = envelopes[0].Limit;

        envelopes = envelopes.filter((cat) => cat.Category !== id);

        res.render('pages/Index', {envelopes: envelopes});
    }
});

app.post("/transfer", (req, res) =>{
    const from = req.body.from;
    const to = req.body.to;


    const totalLimit = envelopes[0].Limit;
    const fromIndex = envelopes.findIndex((cat) => cat.Category === from);
    const toIndex = envelopes.findIndex((cat) => cat.Category === to);

    if(fromIndex === 0){
        res.send("You can't transer from total, please use the create page.");
    }else{
        envelopes[toIndex].Limit = Number(envelopes[toIndex].Limit) + Number(envelopes[fromIndex].Transfer);
        envelopes[fromIndex].Limit = Number(envelopes[fromIndex].Limit) - Number(envelopes[fromIndex].Transfer);
        envelopes[toIndex].Transfer = Number(envelopes[toIndex].Transfer) + Number(envelopes[fromIndex].Transfer);
        envelopes[fromIndex].Transfer = 0;

        res.render('pages/Index', {envelopes: envelopes});
    }
});

app.listen("3000", () =>{
    console.log(`Server running on port 3000`);
});