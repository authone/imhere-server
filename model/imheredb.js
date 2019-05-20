
config = require ("../config");
const nano = require('nano')(config.couchdb.address);

class CouchDb {
    constructor() {}
    init() {
        this.imheredb = nano.db.use('imhere');
    }

    async addPulse(pulse) {
        var pulsedb = null;
        try {
            pulsedb = await this.imheredb.get(pulse.id, { rev_infos: true });
            console.log("imheredb.get(): " + pulsedb.toString());
        }
        catch (err) {
            console.log("imhere.get(): error: " + err);
        }

        var result = null;
        if (pulsedb == null) {
            try {
                result = await this.imheredb.insert(pulse, pulse.id);
                console.log("imheredb.insert(): " + result);
            }
            catch (err) {
                console.log("imheredb.insert(): error: " + err);
                throw(err);
            }
        }
        else {
            try {
                pulsedb.msg = pulse.msg;
                pulsedb.name = pulse.name;
                pulsedb.PulseTime = pulse.PulseTime;
                pulsedb.room = pulse.room;
                pulsedb.smoker = pulse.smoker;
                result = await this.imheredb.insert(pulsedb);//, { _id: pulsedb.id, _rev: pulsedb._rev });
                console.log("imheredb.insert(): " + result);
            }
            catch (err) {
                console.log("imheredb.insert(): error: " + err);
                throw (err);
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

    }

    selectUsers(startpulse, endpulse, callbk_ok) {
        // var result = await imheredb.search("orderedUsers", "byPulseTime");
        this.imheredb.view("orderedUsers", "byPulseTime", { startkey: startpulse, endkey: endpulse, 'include_docs': true })
            .then((body) => {
                var pulses = [];
                body.rows.forEach( row => {
                    pulses.push(row.doc);
                });
                callbk_ok(pulses);
            })
            .catch ((err) => {
                console.log(`selectUsers: error: ${err}`);
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

    getUser(id, callbk_ok) {
        this.imheredb.get(id)
            .then( (body) => callbk_ok(body) )
            .catch( (err) => {
                console.log(`getUser: error: ${err}`);
            });
    }
}

module.exports = CouchDb;
