
/* global describe:true it:true expect: true */

import Web3 from 'web3'

import { RougeProtocol } from '../src/index'

// const issuerPkey = '0x1111111111111111111111111111111111111111111111111111111111111111'

const web3 = new Web3('https://sokol.poa.network')

const rouge = RougeProtocol({ web3 })

describe('RougeProtocol', () => {

  it('account', async () => {
    // const w3Account = web3.eth.accounts.privateKeyToAccount(issuerPkey)
    const issuer = (await rouge)
    // const x2 = (await rouge).as(w3Account)
    expect.assertions(1)
    expect(issuer.rgeAddress).toBe('0x277FB7D416B6316E17954823aa621F3E321c8a72')
  })

})
