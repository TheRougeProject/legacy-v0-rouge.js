
/* global jest:true describe:true test:true expect:true */

import Web3 from 'web3'
// import moment from 'moment'

import { RougeProtocol } from '../src/index'

import * as solidity from '../node_modules/rouge-protocol-solidity/package.json'

const rgeAddressSokol = '0x5475300766433dd082a7340fc48a445c483df68f'
const currentFactory = '0x277FB7D416B6316E17954823aa621F3E321c8a72'
const currentDefaultTare = '100000'

// const provider = new Web3.providers.HttpProvider('https://sokol.poa.network')

const web3 = new Web3('https://sokol.poa.network')

// TODO test on ganache
// const ganache = require("ganache-core")
// const web3 = new Web3(ganache.provider())

// issuer TEST addres is 0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A
const issuerPkey = '0x1111111111111111111111111111111111111111111111111111111111111111'
const issuerAccount = web3.eth.accounts.privateKeyToAccount(issuerPkey)
const issuerMinFuel = 100 // finney
const issuerMinRGE = 10 * 10 ** 6

// user TEST addres is 0x1563915e194D8CfBA1943570603F7606A3115508
const userPkey = '0x2222222222222222222222222222222222222222222222222222222222222222'
const userAccount = web3.eth.accounts.privateKeyToAccount(userPkey)
const userMinFuel = 10 // finney

jest.setTimeout(18000)

describe('Precondition tests', () => {

  // should have at least N ETH/POA to start the test

  test('enough Fuel issuer', async () => {
    const finney = parseInt(web3.utils.fromWei(await web3.eth.getBalance(issuerAccount.address), 'finney'))
    return expect(finney).toBeGreaterThan(issuerMinFuel)
  })

  test('enough Fuel user', async () => {
    const finney = parseInt(web3.utils.fromWei(await web3.eth.getBalance(userAccount.address), 'finney'))
    return expect(finney).toBeGreaterThan(userMinFuel)
  })

  // and N RGE

  test('enough RGE', async () => {
    const tokens = web3.utils.toBN(await rouge.RGE$.balanceOf(issuerAccount.address)).toNumber()
    return expect(tokens).toBeGreaterThan(issuerMinRGE)
  })

})

const rouge = RougeProtocol(web3)

describe('rouge protocol object is not extensible', () => {
  test(
    `adding attribut to object should Throw`,
    () => expect(() => { rouge.newAttribut = true }).toThrow()
  )
})

describe('RougeProtocol RGE object', () => {

  test('RGE$address', async () => {
    expect.assertions(1)
    return expect(await rouge.RGE$.address).toBe(rgeAddressSokol)
  })

  test('RGE$balanceOf', async () => {
    expect.assertions(1)
    return expect(await rouge.RGE$.balanceOf('0x0101010101010101010101010101010101010101')).toEqual('0')
  })

})

describe('RougeProtocol factory object', () => {

  test('factory$address', async () => {
    expect.assertions(1)
    return expect(await rouge.factory$.address).toBe(currentFactory)
  })

  test('factory$version', async () => {
    expect.assertions(1)
    return expect(await rouge.factory$.version).toBe(solidity.version)
  })

  test('factory$tare', async () => {
    expect.assertions(1)
    return expect((await rouge.factory$.tare).toString()).toEqual(currentDefaultTare)
  })

})

describe('RougeProtocol account object', () => {

  test('as using address', async () => {
    expect.assertions(1)
    return expect(await rouge.as(issuerAccount.address).account$.address).toEqual(issuerAccount.address)
  })

  test('as using private key', async () => {
    expect.assertions(1)
    return expect(await rouge.as({ pkey: issuerPkey }).account$.address).toEqual(issuerAccount.address)
  })

  test('as using web3 account object', async () => {
    expect.assertions(1)
    return expect(await rouge.as(issuerAccount).account$.address).toEqual(issuerAccount.address)
  })

})

describe('rouge.createCampaign()', () => {

  const campaignName = 'Jest __tests__ campaign'
  const campaignScheme = '0x0001ffee'
  const campaignIssuance = 2
  const campaignPromise = rouge.as(issuerAccount).createCampaign({
    name: campaignName,
    issuance: campaignIssuance,
    scheme: campaignScheme
  })

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
