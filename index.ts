import * as cors from 'cors'
import { getFormSubmissions, newFormSubmission, Submission } from 'dappform-forms-api'
import * as express from 'express'
import { getFile, putFile } from 'dappform-forms-api/dist/lib/write'
import { Request, Response } from 'express'

const wt = require('webtask-tools')

const loadBlockstack = require('blockstack-anywhere')
const blockstack = require('blockstack')

function initBlockstack(context: any) {
  console.assert(context.secrets.BLOCKSTACK, "missing BLOCKSTACK")
  console.assert(context.secrets.BLOCKSTACK_GAIA_HUB_CONFIG, "missing BLOCKSTACK_GAIA_HUB_CONFIG")
  console.assert(context.secrets.BLOCKSTACK_TRANSIT_PRIVATE_KEY, "missing BLOCKSTACK_TRANSIT_PRIVATE_KEY")

  process.env.BLOCKSTACK = context.secrets.BLOCKSTACK
  process.env.BLOCKSTACK_GAIA_HUB_CONFIG = context.secrets.BLOCKSTACK_GAIA_HUB_CONFIG
  process.env.BLOCKSTACK_TRANSIT_PRIVATE_KEY = context.secrets.BLOCKSTACK_TRANSIT_PRIVATE_KEY
  loadBlockstack()
}

const app = express()

app.use(cors())

app.get('/version', (req:any, res) => res.send(req.webtaskContext.secrets.version || "0.0.0"))

interface WtReq extends Request {
  webtaskContext: Object,
}

app.post('/:formUuid', async (req: WtReq, res:Response) => {
  const formUuid = req.params.formUuid
  console.assert(formUuid, "Didn't find form id")
  initBlockstack(req.webtaskContext)

  const statsFile = `views/${formUuid}.json`
  type FormStats = {
    numViews: number
    numSubmissions: number
  }
  let viewsObj:FormStats = await getFile(statsFile) as any

  if (!viewsObj) {
    viewsObj = <FormStats>{
      numViews: 0,
    }
  }
  viewsObj.numViews += 1

  const submissions = await getFormSubmissions(formUuid)
  console.log('subs to form '+formUuid)
  console.log(submissions[formUuid])

  const numSubmissions = submissions[formUuid] ? Object.values( submissions[formUuid] ).length : 0
  viewsObj.numSubmissions = numSubmissions

  try {
    await putFile(statsFile, viewsObj) // will encrypt file
    console.log("wrote "+statsFile, viewsObj)
  }
  catch (e) {
    console.error(e)
    return res.sendStatus(500)
  }

  res.sendStatus(202)
})


module.exports = wt.fromExpress(app)
// app.listen(3000, ()=> {
  // simpleWebhook("http://localhost:3000",{"data": {}})
  // console.debug('listening on 3000')
// })