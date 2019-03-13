const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const logger = require('morgan');
const http = require('http');
const cors = require('cors');
var config = require('./config');

app.use(logger('combined'));
app.use(bodyParser.json());
app.use('/static', express.static('static'))
app.use(cors());

const nano = require('nano')(config.couchdb.address);

const imheredb = nano.db.use('imhere');

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Pulse {
    constructor( pulsedto ) {
        this._id = pulsedto._id;
        this._name = pulsedto._name;
        this._smoker = pulsedto._smoker;
        this._room = pulsedto._room;
    }
    setRevision(revision) {
        this._rev = revision;
    }
}

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

/*
 "user": {
    "name": "George Gugulea",
    "id": "georgeg",
    "msg": "imhere",
    "smoker": false,

  }
*/
app.post('/imhere', function(req, resp) {
    const pulsejs = req.body;
    console.log("app.post(): " + pulsejs);
    var now = new Date();

    const doc = {};
    doc.PulseTime = [now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()];
    // doc.PulseTime = Date();
    doc.user = req.body;
    asyncInsertUser(doc);
    resp.send("👍");
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


async function asyncInsertUser(doc) {
    var user = null;
    try {
        user = await imheredb.get(doc.user.id, { rev_infos: true });
        console.log("image.get(): " + user.toString());
    }
    catch(err) {
        console.log("imhere.get(): error: " + err);
    }

    var result = null;
    if(user == null ) {
        try {
            result = await imheredb.insert(doc, doc.user.id );
            console.log("imheredb.insert(): " + result);
        }
        catch (err) {
            console.log("imheredb.insert(): error: " + err);
        }
    }
    else {
        try {
            result = await imheredb.insert(doc, { _id: doc.user.id, _rev: user._rev });
            console.log("imheredb.insert(): " + result);
        }
        catch (err) {
            console.log("imheredb.insert(): error: " + err);
        }
 
    }

    // imheredb.get(doc.user.id, {rev_infos: true})
    //         .then( (body) => {
    //             console.log("imhere get: " + body);
    //             user = body;
    //         })
    //         .then(
    //         )
    //         .catch( (err) => {
    //             console.log("imheredb error: " + err);
    //             user = null;
    //         });


    // var revision = null;
    // if( users.size > 0 ) {
    //     revision = users[0].rev;
    // }
    // const result = await imheredb.insert( doc, { _id: doc.user.id, _rev: revision} );
    // return result;
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

http.createServer(app).listen(config.server.hostport, config.server.hostname);

