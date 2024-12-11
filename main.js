const express = require("express");
const bodyParser = require("body-parser");

const app = new express();
const PORT = 3000;

app.use(bodyParser.json());

let envelopes = [{
    Category: "Total",
    Limit: 2000,
    Transfer: 0
}];

app.get("/", (req, res) =>{
    res.send(envelopes);
});

app.get("/envelopes", (req, res) =>{
    res.send(envelopes);
});

app.get("/envelopes/:id", (req, res) =>{
    const {id} = req.params;

    const foundCategory = envelopes.find((cat) => cat.Category === id);

    console.log(foundCategory);
    res.send(foundCategory);
});

app.post("/envelope", (req, res) =>{
    const totalLimit = envelopes[0].Limit;
    const data = req.body;
    const limit = data.Limit;

    if(limit > totalLimit){
        res.send("You've ran out of money. T_T");
    }else{
        envelopes[0].Limit -= limit;
        envelopes.push(req.body);
        res.send(envelopes);
    }

});




app.delete("/envelopes/:id", (req, res) =>{
    const {id} = req.params;

    if(id === "Total"){
        res.send("You can't Delete the total amount");
    }else{
        const foundCategory = envelopes.find((cat) => cat.Category === id);
        envelopes[0].Limit += foundCategory.Limit;

        envelopes = envelopes.filter((cat) => cat.Category !== id);

        res.send(`${id} was deleted`);
    }

})

app.put("/envelopes/:id", (req, res) =>{
    const {id} = req.params;

    if( id !== "Total"){
        const totalLimit = envelopes[0].Limit;
        const foundIndex = envelopes.findIndex((cat) => cat.Category === id);
        envelopes[0].Limit += envelopes[foundIndex].Limit;

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
                envelopes[foundIndex].Category = data.Category;
                envelopes[foundIndex].Limit = data.Limit;
                envelopes[foundIndex].Transfer = data.Transfer;

                res.send(`${id} has been updated`);  
            }
            
        }
    }else{
        const data = req.body;
        const newLimit = data.Limit;
        envelopes[0].Limit = newLimit;
        res.send(`Total was updated`);
    }
});

app.put("/envelopes/:from/:to", (req, res) =>{
    const {from, to} = req.params;


    const totalLimit = envelopes[0].Limit;
    const fromIndex = envelopes.findIndex((cat) => cat.Category === from);
    const toIndex = envelopes.findIndex((cat) => cat.Category === to);

    if(envelopes[fromIndex].Transfer > envelopes[fromIndex].Limit){
        res.send("Transfer amount can't be more than it's limit");
    }else{
        envelopes[toIndex].Limit += envelopes[fromIndex].Transfer;
        envelopes[fromIndex].Limit -= envelopes[fromIndex].Transfer;

        res.send(envelopes);
    }
});


app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
});