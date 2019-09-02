
/* global jest:true beforeAll:true describe:true test:true expect:true */

import Web3 from 'web3'
// import moment from 'moment'

import { RougeProtocol } from '../src/index'

// const provider = new Web3.providers.HttpProvider('https://sokol.poa.network')

const web3 = new Web3('https://sokol.poa.network')

// TODO test on ganache
// const ganache = require("ganache-core")
// const web3 = new Web3(ganache.provider())

// issuer TEST addres is 0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A
const issuerPkey = '0x1111111111111111111111111111111111111111111111111111111111111111'
const issuerAccount = web3.eth.accounts.privateKeyToAccount(issuerPkey)
const issuerMinFuel = 100 // finney
// const issuerMinRGE = 10 * 10 ** 6

// user TEST addres is 0x1563915e194D8CfBA1943570603F7606A3115508
const userPkey = '0x2222222222222222222222222222222222222222222222222222222222222222'
const userAccount = web3.eth.accounts.privateKeyToAccount(userPkey)
// const userMinFuel = 10 // finney

jest.setTimeout(18000)

const campaignName = 'Jest __tests__ campaign'
const campaignScheme = '0x0001ffee'
const campaignIssuance = 2

let campaignPromise

const checkFinney = account => async () => {
  if (parseInt(web3.utils.fromWei(await web3.eth.getBalance(account.address), 'finney')) > issuerMinFuel) {
    campaignPromise = rouge.as(issuerAccount).createCampaign({
      name: campaignName,
      issuance: campaignIssuance,
      scheme: campaignScheme
    })
    return campaignPromise
  } else {
    return Promise.reject(new Error('Insufficient funds.'))
  }
}

// and N RGE
/*
  test('enough RGE', async () => {
  const tokens = web3.utils.toBN(await rouge.RGE$.balanceOf(issuerAccount.address)).toNumber()
  return expect(tokens).toBeGreaterThan(issuerMinRGE)
  })
*/

const rouge = RougeProtocol(web3)

describe('rouge.createCampaign()', () => {

  beforeAll(checkFinney(issuerAccount))
  // beforeAll(checkFinney(userAccount))

  test('return campaign object', async () => {
    expect.assertions(3)
    await expect(campaignPromise).resolves.toHaveProperty('distributeNote')
    await expect(campaignPromise).resolves.toHaveProperty('acquireNote')
    await expect(campaignPromise).resolves.toHaveProperty('redeemNote')
  })

  test('campaign.address', async () => {
    const campaign = await campaignPromise
    await expect(campaign.address).resolves.toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  test('campaign.name', async () => {
    const campaign = await campaignPromise
    return expect(campaign.name).resolves.toEqual(campaignName)
  })

  test('campaign.scheme', async () => {
    const campaign = await campaignPromise
    return expect(campaign.scheme).resolves.toEqual(campaignScheme)
  })

  test('campaign.issuance', async () => {
    const campaign = await campaignPromise
    return expect(campaign.issuance).resolves.toEqual(campaignIssuance.toString())
  })

  test('campaign.canDistribute', async () => {
    const campaign = await campaignPromise
    return expect(campaign.canDistribute).resolves.toEqual(true)
  })

  test('campaign.canSignRedemption', async () => {
    const campaign = await campaignPromise
    return expect(campaign.canSignRedemption).resolves.toEqual(true)
  })

  test('campaign.distributeNote()', async () => {
    const campaign = await campaignPromise
    expect.assertions(3)
    await expect(campaign.acquired).resolves.toEqual('0')
    // hash mode
    await expect(campaign.distributeNote(userAccount.address)).resolves.toHaveProperty('blockHash')
    await expect(campaign.acquired).resolves.toEqual('1')
    // todo
    // const mutation = campaign.distributeNote(userAccount.address)
    // console.log(mutation) => test all modes
  })

})
