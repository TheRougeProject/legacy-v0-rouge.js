
/* global describe:true test:true expect:true */

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
