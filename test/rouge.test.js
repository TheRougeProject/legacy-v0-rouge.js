
/* global beforeAll:true describe:true test:true expect:true */

import { RougeProtocol } from '../src/index'

import { initializeWeb3 } from './helpers.js'

let mockup
beforeAll(async () => { mockup = await initializeWeb3() })

describe('RougeProtocol(web3)', () => {

  let rouge

  test('should return rouge object', () => {
    rouge = RougeProtocol(mockup.web3, { rge: mockup.rge.options.address })

    expect(rouge).toHaveProperty('AUTH$')
    expect(rouge).toHaveProperty('RGE$')
    expect(rouge).toHaveProperty('factory$')
    expect(rouge).toHaveProperty('account$')
  })

  describe('rouge object is not extensible', () => {
    test(
      `adding attribut to campaign object should Throw`,
      () => {
        expect(() => { rouge.newAttribut = true }).toThrow()
      }
    )
  })

  describe('rouge.RGE$.address', () => {
    test(
      'should return RGE token address',
      () => expect(rouge.RGE$.address).resolves.toEqual(mockup.rge.options.address)
    )
  })

  describe('rouge.RGE$.factory', () => {
    test(
      'should return factory contract address',
      () => expect(rouge.factory$.address).resolves.toEqual(mockup.factory.options.address)
    )
  })

  describe('rouge.RGE$.as(account)', () => {
    test('should return the same rouge object', () => {
      expect(rouge.as(mockup.accounts[0])).toBe(rouge)
    })
  })

})
