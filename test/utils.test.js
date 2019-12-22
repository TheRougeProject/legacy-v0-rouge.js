
/* global describe:true test:true expect: true */
/* eslint-disable max-len */

import { RougeProtocol } from '../src/index'

// import Web3 from 'web3'
// const utils = RougeProtocol(Web3).util$

import Web3Utils from 'web3-utils'
const utils = RougeProtocol(Web3Utils).util$

const bearer = '0x955d20aedce1227941b12fa27aa1c77af758e10c'
const bearerPkey = '0xc81c5128f1051be82c1896906cb1e283e07ec99e8ff53c5d02ea78cf5e7cc790'

const campaign = '0x0000000000000000000000000000000000000000'

const testQR = 'lV0grtzhInlBsS-ieqHHevdY4QxxWTZ9nIkzm5oXuR1CDRY_EarFMBk_53c4Bt_Hc70qdD9kqlqaKMPR3gwfAhWtK5krL2Io5KQuhq-CsmetisY0G3Rlc3QweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA='

describe('authHash', () => {

  test('authHash', () => {
    const result = utils.authHash('test', campaign, bearer)
    expect(result).toBe('0xaf559c04bf271bb8334896050e30475b9aecfb9ca9b4dd3e3a53bff92ff166c4')
  })

})

describe('authHashProtocolSig', () => {

  test('authHashProtocolSig', () => {
    const result = utils.authHashProtocolSig('test', campaign, bearer, bearerPkey)
    expect(result).toEqual({r: '0x3d322f73b8d7d487942b96f9f492ae505ecb96cb1ecf25b19ebbb94f3e8025ed', s: '0x6b415e8587da03572cd7ed3752f855cafe628bd9d79f2db54d61b2facfcb34ba', recoveryParam: 1, v: 28})
  })

})

describe('authHashRpcSig', () => {

  test('authHashRpcSig', () => {
    const result = utils.authHashRpcSig('test', campaign, bearer, bearerPkey)
    expect(result).toBe('0x45a818e4de1073e981db14fa7defe0808c14badaada723c0d5eb17c44f82325771a7a1388c57533d7f1594d2f59a0ec1681286d399725a9e3294ac80e641a1811b')
  })

})

describe('rougeQR', () => {

  test('rougeQR', () => {
    const result = utils.rougeQR('test' + campaign, campaign, bearer, bearerPkey)
    expect(result).toBe(testQR)
  })

})

const getCampaign = function (msg, bearer) {
  return msg.slice(4, msg.length)
}

describe('decodeRougeQR', () => {

  test('decodeRougeQR', () => {
    const result = utils.decodeRougeQR(testQR, getCampaign)
    expect(result).toEqual({msg: 'test' + campaign, campaign, bearer})
  })

})
