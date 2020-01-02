
import Web3 from 'web3'

import { RougeProtocol } from '../src/index'

import { sendTestRGE, generateRgeMockup } from '../src/RGEMockup'

const ganache = require('ganache-core')

export const initializeWeb3 = options => {

  const web3 = new Web3()
  return ganacheSetup(web3, options)

}

export const poaSetup = async web3 => {

  // const web3 = new Web3('https://sokol.poa.network')

  const rouge = RougeProtocol(web3)

  const issuerPkey = '0x1111111111111111111111111111111111111111111111111111111111111111'
  const issuerAccount = web3.eth.accounts.privateKeyToAccount(issuerPkey)

  const campaignAddress = '0x79fe544d081210b15bcfbb0cbd9ca12c5c11226c'
  const campaign = rouge.as(issuerAccount).campaign$(campaignAddress)

  return { issuerPkey, issuerAccount, campaign }
}

const ganacheSetup = async (web3, options) => {

  try {

    web3.setProvider(ganache.provider(options))

    const [rgeOwner, ...accounts] = await web3.eth.getAccounts()
    const mockup = await generateRgeMockup(web3, rgeOwner)

    // give 10 RGE to every accounts
    await Promise.all(accounts.map(account => sendTestRGE(web3, mockup.rge, account, '10000000')))

    return { web3, accounts, ...mockup }

  } catch (e) {
    console.log(e)
  }

}
