
/* global jest:true describe:true test:true expect:true */

import Web3 from 'web3'

import { RougeProtocol } from '../src/index'

import * as protocolSolidity from '../node_modules/rouge-protocol-solidity/package.json'

const web3 = new Web3('https://sokol.poa.network')

const rouge = RougeProtocol(web3)

const issuerPkey = '0x1111111111111111111111111111111111111111111111111111111111111111'
const issuerAccount = web3.eth.accounts.privateKeyToAccount(issuerPkey)

const campaignAddress = '0x79fe544d081210b15bcfbb0cbd9ca12c5c11226c'
const campaign = rouge.as(issuerAccount).campaign$(campaignAddress)

jest.setTimeout(10000)

describe('campaign object is not extensible', () => {
  test(
    `adding attribut to object campaign should Throw`,
    () => expect(() => { campaign.newAttribut = true }).toThrow()
  )
})

describe('campaign.version()', () => {
  test(
    `return ${protocolSolidity.version}`,
    async () => expect(await campaign.version).toEqual(protocolSolidity.version)
  )
})

describe('campaign.tare()', () => {
  const expected = '100000'
  test(
    `return ${JSON.stringify(expected)}`,
    async () => expect(await campaign.tare).toEqual(expected)
  )
})

describe('campaign.info()', () => {
  const expected = '0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a0001ffff000000000000000000000000000000000000000000000000000000005d2ec3854a45535420544553542063616d706169676e' // eslint-disable-line max-len
  test(
    `return ${expected}`,
    async () => expect(await campaign.info).toEqual(expected)
  )
})

describe('campaign.issuer()', () => {
  const expected = issuerAccount.address
  test(
    `return ${JSON.stringify(expected)}`,
    async () => expect(await campaign.issuer).toEqual(expected)
  )
})

describe('campaign.scheme()', () => {
  const expected = '0x0001ffff'
  test(
    `return ${JSON.stringify(expected)}`,
    async () => expect(await campaign.scheme).toEqual(expected)
  )
})

describe('campaign.expiration()', () => {
  const expected = '1563345797'
  test(
    `return ${JSON.stringify(expected)}`,
    async () => expect(await campaign.expiration).toEqual(expected)
  )
})

describe('campaign.name()', () => {
  test(
    `return 'JEST TEST campaign'`,
    async () => expect(await campaign.name).toEqual('JEST TEST campaign')
  )
})

describe('campaign.state()', () => {
  const expected = '0x0000000101000000010000000000000000'
  test(
    `return ${expected}`,
    async () => expect(await campaign.state).toEqual(expected)
  )
})

describe('campaign.issuance()', () => {
  const expected = '1'
  test(
    `return ${expected}`,
    async () => expect(await campaign.issuance).toEqual(expected)
  )
})

describe('campaign.isIssued()', () => {
  const expected = true
  test(
    `return ${expected}`,
    async () => expect(await campaign.isIssued).toEqual(expected)
  )
})

// expected to build from state

describe('campaign.available()', () => {
  const expected = '1'
  test(
    `return ${expected}`,
    async () => expect(await campaign.available).toEqual(expected)
  )
})

describe('campaign.acquired()', () => {
  const expected = '0'
  test(
    `return ${expected}`,
    async () => expect(await campaign.acquired).toEqual(expected)
  )
})

describe('campaign.redeemed()', () => {
  const expected = '0'
  test(
    `return ${expected}`,
    async () => expect(await campaign.redeemed).toEqual(expected)
  )
})
