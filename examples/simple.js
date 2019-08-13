
import Web3 from 'web3'
import moment from 'moment'

import { RougeProtocol } from '../src/index'

const web3 = new Web3('https://sokol.poa.network')

const issuer = web3.eth.accounts.privateKeyToAccount('0xaaaa'.padEnd(66,'0'))

console.log(`campaign issuer is ${issuer.address}`)

const user1 = web3.eth.accounts.privateKeyToAccount('0x1111'.padEnd(66,'0'))
const user2 = web3.eth.accounts.privateKeyToAccount('0x2222'.padEnd(66,'0'))
const user3 = web3.eth.accounts.privateKeyToAccount('0x3333'.padEnd(66,'0'))

const rouge = RougeProtocol(web3)

const run = async () => {

  console.log('creating campaign (could take a few seconds...)')

  const campaign = await rouge.as(issuer).createCampaign({
    name: 'Simple demo Rouge campaign',
    issuance: 10,
    expiration: moment().add(moment.duration(2, 'days')).format('X')
    // precheck: true
  })

  console.log(`issuer has created a campaign at address ${await campaign.address}`)

  await campaign.distributeNote(user1.address)

  console.log(`issuer has distributed a voucher note to user account ${user1.address}`)

  const authSig = campaign.acceptRedemptionSig$(user1)

  console.log('issuer create a signature to authorize redemption by user1: ', authSig)

  console.log(`switching campaign context to user1, and let him redeemNote`)

  const hasNote = await campaign.as(user1).hasNote

  console.log(`verify user1 has acquired a note : ${hasNote}`)

  const res = await campaign.as(user1).redeemNote(issuer, authSig)

  console.log('receipt from redemption on the blockchain', res)

}

run()
