
/* global beforeAll:true describe:true test:true expect:true */

import { RougeProtocol } from '../src/index'

import { initializeWeb3 } from './helpers.js'

import * as protocolSolidity from '../node_modules/rouge-protocol-solidity/package.json'

const [major, minor] = protocolSolidity.version.split('.')

let mockup
beforeAll(async () => { mockup = await initializeWeb3() })

const defaultTare = '100000'
const campaignCreationTestDefaulParams = {
  name: 'Jest __tests__ campaign',
  issuance: 3
}

describe('RougeProtocol(web3).createCampaign()', () => {

  let rouge
  let campaignPromise

  test('should return Promise campaign object', async () => {
    rouge = RougeProtocol(mockup.web3, { rge: mockup.rge.options.address })

    campaignPromise = rouge.as(mockup.accounts[0]).createCampaign(campaignCreationTestDefaulParams)

    await expect(campaignPromise).resolves.toHaveProperty('canAttach')
    await expect(campaignPromise).resolves.toHaveProperty('canIssue')
    await expect(campaignPromise).resolves.toHaveProperty('canDistribute')
    await expect(campaignPromise).resolves.toHaveProperty('canSignRedemption')
    await expect(campaignPromise).resolves.toHaveProperty('canKill')
  })

  describe('campaign object is not extensible', () => {
    test(
      `adding attribut to campaign object should Throw`,
      () => campaignPromise.then(
        campaign => expect(() => { campaign.newAttribut = true }).toThrow()
      )
    )
  })

  describe('issuance * tare RGE tokens have been from issuer to campaign contract', () => {
    const expected = parseInt(defaultTare) * campaignCreationTestDefaulParams.issuance
    test(
      `rge.balanceOf(campaign) should return ${expected}`,
      () => campaignPromise.then(
        async campaign => expect(
          await rouge.RGE$.balanceOf(await campaign.address)).toEqual(expected.toString())
      )
    )
    const expectedIssuer = 10000000 - expected
    test(
      `rge.balanceOf(issuer) should return ${expectedIssuer}`,
      () => campaignPromise.then(
        async campaign => expect(
          await rouge.RGE$.balanceOf(mockup.accounts[0])).toEqual(expectedIssuer.toString())
      )
    )
  })

  describe('campaign.version()', () => {
    const expected = `${major}.${minor}`
    test(
      `should return ${expected}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.version).toEqual(expected)
      )
    )
  })

  describe('campaign.tare()', () => {
    const expected = defaultTare
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.tare).toEqual(expected)
      )
    )
  })

  describe('campaign.info()', () => {
    const expected = a => ({
      issuer: a,
      name: 'Jest __tests__ campaign',
      scheme: '0x0001ffff'
    })
    test(
      `should return an object containing ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.info).toEqual(
          expect.objectContaining(expected(mockup.accounts[0]))
        )
      )
    )
  })

  describe('campaign.issuer()', () => {
    test(
      `should return the issuer address`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.issuer).toEqual(mockup.accounts[0])
      )
    )
  })

  describe('campaign.scheme()', () => {
    const expected = '0x0001ffff'
    test(
      `return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.scheme).toEqual(expected)
      )
    )
  })

  describe('campaign.expiration()', () => {
    const expected = (Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14) / 1000
    test(
      `should return approximatly ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(parseInt(await campaign.expiration) / 1000).toBeCloseTo(expected)
      )
    )
  })

  describe('campaign.name()', () => {
    const expected = campaignCreationTestDefaulParams.name
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.name).toEqual(expected)
      )
    )
  })

  describe('campaign.state()', () => {
    const expected = {
      acquired: 0,
      free: campaignCreationTestDefaulParams.issuance,
      issuance: campaignCreationTestDefaulParams.issuance,
      issued: true,
      redeemed: 0
    }
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.state).toEqual(expected)
      )
    )
  })

  describe('campaign.issuance()', () => {
    const expected = campaignCreationTestDefaulParams.issuance.toString()
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.issuance).toEqual(expected)
      )
    )
  })

  describe('campaign.isIssued()', () => {
    const expected = true
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.isIssued).toEqual(expected)
      )
    )
  })

  describe('campaign.available()', () => {
    const expected = campaignCreationTestDefaulParams.issuance.toString()
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.available).toEqual(expected)
      )
    )
  })

  describe('campaign.acquired()', () => {
    const expected = '0'
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.acquired).toEqual(expected)
      )
    )
  })

  describe('campaign.redeemed()', () => {
    const expected = '0'
    test(
      `should return ${JSON.stringify(expected)}`,
      () => campaignPromise.then(
        async campaign => expect(await campaign.redeemed).toEqual(expected)
      )
    )
  })

})
