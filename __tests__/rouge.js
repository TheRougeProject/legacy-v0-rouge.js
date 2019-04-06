
/* global describe:true it:true expect: true */

import Web3 from 'web3'

import { RougeProtocol } from '../src/index'

// const issuerPkey = '0x1111111111111111111111111111111111111111111111111111111111111111'

const web3 = new Web3('https://sokol.poa.network')

const rouge = RougeProtocol({ web3 })

describe('RougeProtocol', () => {

  // it('rgeAddress', async () => {
  //   // const w3Account = web3.eth.accounts.privateKeyToAccount(issuerPkey)
  //   const issuer = (await rouge)
  //   // const x2 = (await rouge).as(w3Account)
  // })

  it('rgeAddress', async () => {
    // const issuer = (await rouge)
    expect.assertions(1)
    return expect((await rouge).rgeAddress).toBe('0x5475300766433dd082a7340fc48a445c483df68f')
  })

  it('tare', async () => {
    expect.assertions(1)
    return expect(await (await rouge).tare).toEqual({_hex: '0x0186a0'})
  })

})
