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

var CouchDb = require('./model/imheredb');
db = new CouchDb();
db.init();

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

app.get('/about/', (req, resp) => res.send('Hello CSGN, imhere - v1.0.0! 👍'))

app.get('/lasth/', function (req, resp) {
    console.log(`${req.method} ${req.url}`);
    var lasth = new Date();
    var endDate = date_to_array(lasth);

    lasth.setTime( (new Date()).getTime() - 3600*1000 )
    var startDate = date_to_array(lasth);

    db.selectUsers(startDate, endDate, function (result) {
        console.log(`Sending result [${req.method} ${req.url}]: ${JSON.stringify(result)}`);
        resp.send(result);
    });
});

app.get('/aftereight/', function (req, resp) {
    console.log(`${req.method} ${req.url}`);

    var today = new Date();
    var endDate = date_to_array(today);

    // if we are already tomorrow, then get 8 of yesterday setDate supports negative numbers
    var yesterday = new Date(today);
    if(today.getHours() < 20) { yesterday.setDate(today.getDate()-1); }
    yesterday.setHours(20, 0, 0, 0);
    var startDate = date_to_array(yesterday);

    db.selectUsers(startDate, endDate, function(result) {
        console.log(`Sending result [${req.method} ${req.url}]: ${JSON.stringify(result)}`);
        resp.send(result);
    });
});

app.get('/user/:id', function(req, resp) {
    console.log(`${req.method} ${req.url}`);
    db.getUser(
        req.params.id, (result) => { 
            console.log(`Sending result [${req.method} ${req.url}]: ${JSON.stringify(result)}`);
            resp.send(result);
        }
    );
});

/**
{
    "id": "georgeg1",
    "name": "George Gugulea",
    "msg": "imhere",
    "smoker": false,
    "room": "O24"
}
*/
app.post('/imhere', function(req, resp) { 
    console.log(`${req.method} ${req.url}\n${JSON.stringify(req.body)}`);
    const pulsejs = req.body;
    var now = new Date();

    pulsejs.PulseTime = date_to_array(now);

    db.addPulse(pulsejs);
    resp.send("👍");
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function date_to_array(date) {
    if(date === null) { date = new Date(); }
    return [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
console.log(`Server started on ${config.server.hostname}:${config.server.hostport}`)
http.createServer(app).listen(config.server.hostport, config.server.hostname);

