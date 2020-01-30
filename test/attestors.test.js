
/* global jest:true beforeAll:true describe:true test:true expect:true */

import { RougeProtocol } from '../src/index'
import { RougeAuthorization } from '../src/constants'

import { initializeWeb3 } from './helpers.js'

jest.setTimeout(8 * 1000)

let mockup
beforeAll(async () => { mockup = await initializeWeb3({ total_accounts: 37 }) })

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

  const expected = {
    canAttach: auth => !!['All', 'Attachment'].includes(auth),
    canIssue: auth => !!['All', 'Issuance'].includes(auth),
    canDistribute: auth => !!['All', 'Acquisition'].includes(auth),
    canSignRedemption: auth => !!['All', 'Redemption'].includes(auth),
    canKill: auth => !!['All', 'Kill'].includes(auth)
  }

  Object.keys(expected).forEach((call, i) => {

    describe(`campaign.addAttestor(AUTH$), then ${call}`, () => {
      Object.keys(RougeAuthorization).forEach(auth => {
        const getAttestor = () => mockup.accounts[RougeAuthorization[auth] + 1 + i * 7]
        test(
          `should return ${JSON.stringify(expected[call](auth))} if AUTH$ = ${auth}`,
          async () => (await campaignPromise).as(mockup.accounts[0]).addAttestor({
            attestor: getAttestor(),
            auths: [RougeAuthorization[auth]]
          }).then(
            async result => {
              expect(result).toEqual(true)
              return expect((await campaignPromise).as(getAttestor())[call]).resolves.toEqual(expected[call](auth))
            }
          )
        )
      })
    })

  })

})
