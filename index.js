"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cors = require("cors");
const dappform_forms_api_1 = require("dappform-forms-api");
const express = require("express");
const write_1 = require("dappform-forms-api/dist/lib/write");
const wt = require('webtask-tools');
const loadBlockstack = require('blockstack-anywhere');
const blockstack = require('blockstack');
function initBlockstack(context) {
    console.assert(context.secrets.BLOCKSTACK, "missing BLOCKSTACK");
    console.assert(context.secrets.BLOCKSTACK_GAIA_HUB_CONFIG, "missing BLOCKSTACK_GAIA_HUB_CONFIG");
    console.assert(context.secrets.BLOCKSTACK_TRANSIT_PRIVATE_KEY, "missing BLOCKSTACK_TRANSIT_PRIVATE_KEY");
    console.assert(context.secrets.BLOCKSTACK_APP_PRIVATE_KEY, "missing BLOCKSTACK_APP_PRIVATE_KEY");
    process.env.BLOCKSTACK_APP_PRIVATE_KEY = context.secrets.BLOCKSTACK_APP_PRIVATE_KEY;
    process.env.BLOCKSTACK = context.secrets.BLOCKSTACK;
    process.env.BLOCKSTACK_GAIA_HUB_CONFIG = context.secrets.BLOCKSTACK_GAIA_HUB_CONFIG;
    process.env.BLOCKSTACK_TRANSIT_PRIVATE_KEY = context.secrets.BLOCKSTACK_TRANSIT_PRIVATE_KEY;
    loadBlockstack();
}
const app = express();
app.use(cors());
app.get('/version', (req, res) => res.send(req.webtaskContext.secrets.version || "0.0.0"));
app.post('/:formUuid', async (req, res) => {
    const formUuid = req.params.formUuid;
    console.assert(formUuid, "Didn't find form id");
    initBlockstack(req.webtaskContext);
    const statsFile = `views/${formUuid}.json`;
    let viewsObj = await write_1.getFile(statsFile);
    if (!viewsObj) {
        viewsObj = {
            numViews: 0,
        };
    }
    viewsObj.numViews += 1;
    const submissions = await dappform_forms_api_1.getFormSubmissions(formUuid);
    console.log('subs to form ' + formUuid);
    console.log(submissions[formUuid]);
    const numSubmissions = submissions[formUuid] ? Object.values(submissions[formUuid]).length : 0;
    viewsObj.numSubmissions = numSubmissions;
    try {
        await write_1.putFile(statsFile, viewsObj, false);
        console.log("wrote " + statsFile, viewsObj);
    }
    catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }
    res.sendStatus(202);
});
module.exports = wt.fromExpress(app);
// app.listen(3000, ()=> {
// simpleWebhook("http://localhost:3000",{"data": {}})
// console.debug('listening on 3000')
// })
