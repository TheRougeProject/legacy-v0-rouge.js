
import Web3 from 'web3'
import moment from 'moment'

import { RougeProtocol } from '../src/index'

const web3 = new Web3('https://sokol.poa.network')

const issuer = web3.eth.accounts.privateKeyToAccount('0xaaaa'.padEnd(66,'0'))

const user1 = web3.eth.accounts.privateKeyToAccount('0x1111'.padEnd(66,'0'))
const user2 = web3.eth.accounts.privateKeyToAccount('0x2222'.padEnd(66,'0'))
const user3 = web3.eth.accounts.privateKeyToAccount('0x3333'.padEnd(66,'0'))

const rouge = RougeProtocol(web3)

const run = async () => {

  const campaign = await rouge.as(issuer).createCampaign({
    name: 'Simple demo Rouge campaign',
    issuance: 10,
    expiration: moment().add(moment.duration(2, 'days')).format('X')
    // precheck: true
  })

  console.log(campaign)


}

run()
