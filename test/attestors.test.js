
/* global beforeAll:true describe:true test:true expect:true */

import { RougeProtocol } from '../src/index'

import { initializeWeb3 } from './helpers.js'

let mockup
beforeAll(async () => { mockup = await initializeWeb3() })

const campaignCreationTestDefaulParams = {
  name: 'Jest __tests__ campaign',
  issuance: '2'
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

  describe('campaign.addAttestor(AUTH$.Acquisition), then canDistribute', () => {
    const expected = true
    test(
      `should return ${JSON.stringify(expected)}`,
      async () => (await campaignPromise).addAttestor({
        attestor: mockup.accounts[1],
        auths: [rouge.AUTH$.Acquisition]
      }).then(
        async result => {
          expect(result).toEqual(true)
          return expect((await campaignPromise).as(mockup.accounts[1]).canDistribute).resolves.toEqual(expected)
        }
      )
    )
  })

  describe('campaign.addAttestor(AUTH$.Redemption), then canIssue', () => {
    const expected = false
    test(
      `should return ${JSON.stringify(expected)}`,
      async () => (await campaignPromise).as(mockup.accounts[0]).addAttestor({
        attestor: mockup.accounts[2],
        auths: [rouge.AUTH$.Redemption]
      }).then(
        async result => {
          expect(result).toEqual(true)
          return expect((await campaignPromise).as(mockup.accounts[2]).canIssue).resolves.toEqual(expected)
        }
      )
    )
  })

})
