const express = require('express');
const bodyParse = require('body-parser');
const db = require('./db.js');

const app = express();

app.set('view engine', 'ejs');

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
    db.getDelete(req, res);
});

app.get("/transfer", (req, res) =>{

    db.getTransfer(req, res);
});

app.get("/Create", (req, res) =>{
    res.render('pages/Create');
});

app.post("/Create", (req, res) =>{
    db.postCreate(req, res);
});

app.post("/envelopes/:id", (req, res) =>{
    db.postEdit(req,res);
});

app.post("/delete/:id", (req, res) =>{
    db.postDelete(req, res);
});

app.post("/transfer", (req, res) =>{
    db.postTransfer(req, res);
});

app.listen("5432", () =>{
    console.log(`Server running on port 5432`);
});