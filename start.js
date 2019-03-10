const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const logger = require('morgan');
const http = require('http');
var config = require('./config');

app.use(logger('combined'));
app.use(bodyParser.json());

const port = 3000
const nano = require('nano')(config.couchdb.address);

const imheredb = nano.db.use('imhere');

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/', (req, resp) => res.send('Hello CSGN - v1.0.0! 👍'))

app.get('/lasth', function (req, resp) {
    var lasth = new Date();
    var endDate = date_to_array(lasth);

    lasth.setTime( (new Date()).getTime() - 3600*1000 )
    var startDate = date_to_array(lasth);

    selectUsers(startDate, endDate, resp);
})

app.get('/aftereight', function (req, resp) {

    var today = new Date();
    var endDate = date_to_array(today);

    // if we are already tomorrow, then get 8 of yesterday setDate supports negative numbers
    var yesterday = new Date(today);
    if(today.getHours() < 20) { yesterday.setDate(today.getDate()-1); }
    yesterday.setHours(20, 0, 0, 0);
    var startDate = date_to_array(yesterday);

    selectUsers(startDate, endDate, resp);
})

app.post('/imhere', function(req, resp) {
    console.log(req.body);
    var now = new Date();
    const user = req.body;
    const doc = {};
    doc.PulseTime = [now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()];
    // doc.PulseTime = Date();
    doc.user = req.body;
    asyncInsertUser(doc);
    resp.send("👍");
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function asyncInsertUser(doc) {
    const result = await imheredb.insert( doc );
    return result;
}

function selectUsers(startpulse, endpulse, resp) {
    // var result = await imheredb.search("orderedUsers", "byPulseTime");
    imheredb.view("orderedUsers", "byPulseTime", { startkey: startpulse, endkey: endpulse, 'include_docs': false }).then( (body) => {
        resp.send(body.rows);
    });
        // function (err, body) {
        //     if (err) console.log(err);
        //     if (!body.rows.length) {
        //         // no goals for this player
        //         console.log(0);
        //     } else {
        //         console.log(body.rows);
        //     }
        // });
    // return result;
}

function date_to_array(date) {
    if(date == null) { date = new Date(); }
    return [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

http.createServer(app).listen(port);
// app.listen(port, () => console.log(`Example app listening on port ${port}!`))
