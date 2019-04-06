
import RGEToken from '@/contracts/RGETokenInterface.json'
import RougeFactory from '@/contracts/RougeFactory.json'
import SimpleRougeCampaign from '@/contracts/SimpleRougeCampaign.json'

import { RougeProtocolAddress, RougeAuthorization } from './constants'
import { successfulTransact, universalAccount, delay } from './utils'

import abi from 'ethereumjs-abi'

import Campaign from './campaign'

const defaultContext = {
  options: {
    gasPrice: '1'
  }
}

// account is Object with web3 1.x structure :
// https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#

function RougeProtocol (context) {
  context = { ...defaultContext, ...context }
  context.account = universalAccount(context.account)

  let { web3, account, options } = context

  /* TODO better check valid web3 */

  if (!/^1.0.0/.test(web3.version)) {
    throw new Error('beta rouge.js can only be used with web3js 1.0.x')
  }

  // const as = address => {
  //   account = universalAccount(address)
  // }

  function campaignAt (address) {
    return Campaign({ ...context, transact$ }, address)
  }

  async function balanceOf$ (address) {
    return rgeInstance.methods.balanceOf(address).call()
  }

  const factoryVersion$ = () => factoryInstance.methods.version().call()
  const factoryTare$ = () => factoryInstance.methods.tare().call()

  const getTxReceipt$ = hash => new Promise(async resolve => {
    const receipt = await web3.eth.getTransactionReceipt(hash)
    if (receipt) {
      resolve(receipt)
    } else {
      await delay(2000)
      resolve(await getTxReceipt$(hash))
    }
  })

  function transact$ (method, to, estimate, encoded) {
    return new Promise(async (resolve, reject) => {
      try {
        // workaround incorrect ABI encoding...
        if (!estimate) estimate = await method.estimateGas({ from: account.address })
        if (!encoded) encoded = await method.encodeABI()
        var rawTx = {
          gasPrice: web3.utils.toHex(web3.utils.toWei(options.gasPrice, 'gwei')),
          gasLimit: web3.utils.toHex(estimate),
          to: to,
          value: '0x00',
          data: encoded
        }
        if (account.privateKey) {
          // const signed = account.signTransaction(rawTx) // XXX doesn't work with beta46
          const signed = await web3.eth.accounts.signTransaction(rawTx, account.privateKey)
          const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction)
          resolve(receipt)
        } else {
          // Promise not yet working beta46 to beta51
          web3.eth.sendTransaction({ from: account.address, ...rawTx }, async (error, hash) => {
            if (error) {
              throw new Error('transact failed.')
            } else {
              resolve(await getTxReceipt$(hash))
            }
          })
          /* Event not yet working beta46 to beta51
             .on(
             'receipt', function (receipt) {
             resolve(receipt)
             }) */
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  const createCampaign = (
    {issuance, scheme, tokens, name, expiration, attestor, auths}
  ) => new Promise(async (resolve, reject) => {
    try {
      // TODO if (!account.privateKey) or not signing provider throw new Error('Unlockable account. [createCampaign]')

      // check if enough token...
      // check expiration

      const rgeAddress = RougeProtocolAddress[await web3.eth.net.getId()].rge
      const rgeContract = new web3.eth.Contract(RGEToken.abi, rgeAddress)
      const method = rgeContract.methods.newCampaign(issuance, tokens)

      const receipt = await transact$(method, rgeAddress)

      if (!successfulTransact(receipt)) throw new Error('can\'t instanciate new campaign. [createCampaign]')

      const campaignAddress = '0x' + receipt.logs[3].topics[2].slice(26, 66) // TODO use decodeLog?
      const campaignContract = new web3.eth.Contract(SimpleRougeCampaign.abi, campaignAddress)

      let method2 // move to Campaign module
      let encoded
      // TODO check attestor & grant syntax/rules
      if (attestor && auths) {
        encoded = '0x' + abi.simpleEncode(
          'issueWithAttestor(bytes4,string,uint,address,uint8[])', scheme, name, expiration, attestor, auths
        ).toString('hex')
        method2 = campaignContract.methods.issueWithAttestor(scheme, name, expiration, attestor, auths)
      } else {
        method2 = campaignContract.methods.issue(scheme, name, expiration)
      }

      const receipt2 = await transact$(method2, campaignAddress, null, encoded)

      if (!successfulTransact(receipt2)) throw new Error('can\'t issue campaign. [createCampaign]')

      resolve(campaignAt(campaignAddress))
    } catch (e) {
      reject(e)
    }
  })

  const getCampaigns = ({scheme, issuer}) => new Promise(async (resolve, reject) => {
    try {
      // const logs = await web3.eth.getPastLogs({
      //   address: factoryAddress,
      //   // event NewCampaign(address indexed issuer, address indexed campaign, uint32 issuance)
      //   topics: ['0x798fca4db5588d669d44c689c1949dc5566b003ef1d73792336bb11e46143085']
      // })
      // scheme should be in topics.
      const logs = await web3.eth.getPastLogs({
        fromBlock: 4056827, // should be factory/version create block by default
        // address: factoryAddress,
        // event Issuance(bytes4 scheme, string name, uint campaignExpiration) => add issuer + version
        topics: ['0x61d7bd1b44357bca3ed4bd238fec71f1710af7c589ab829be7f3be96caa6c5eb']
      })
      resolve(logs.map(log => log.address))
    } catch (e) {
      reject(e)
    }
  })

  const sendFinney = ({fuel, recipient}) => new Promise(async (resolve, reject) => {
    try {
      // TODO if (!account.privateKey) or not signing provider throw new Error('Unlockable account. [createCampaign]')
      recipient = universalAccount(recipient)
      const rawTx = {
        gasPrice: web3.utils.toHex(web3.utils.toWei(options.gasPrice, 'gwei')),
        gasLimit: web3.utils.toHex(21000),
        to: recipient.address,
        value: web3.utils.toHex(web3.utils.toWei(fuel, 'finney'))
      }
      const signed = await web3.eth.accounts.signTransaction(rawTx, account.privateKey)
      const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction)
      if (!successfulTransact(receipt)) throw new Error('error sending sendFinney. [sendFinney]')
      resolve(true)
    } catch (e) {
      reject(e)
    }
  })

  let rgeAddress = null
  let rgeInstance = null
  let factoryAddress = null
  let factoryInstance = null

  return new Promise(async (resolve, reject) => {
    rgeAddress = RougeProtocolAddress[await web3.eth.net.getId()].rge
    rgeInstance = new web3.eth.Contract(RGEToken.abi, rgeAddress, {})

    // Default factory != factory (as param)
    // TODO lazy factory loading...
    // check event SetFactory(address indexed _rge, uint256 _tare) => store first block active factory

    factoryAddress = await rgeInstance.methods.factory().call()
    factoryInstance = new web3.eth.Contract(RougeFactory.abi, factoryAddress)

    const rgeInFactory = await factoryInstance.methods.rge().call()
    if (rgeAddress.toLowerCase() !== rgeInFactory.toLowerCase()) {
      throw new Error('RGE protocol not ready: rge address not set in factory')
    }

    resolve(
      Object.freeze({
        // transact$,
        getTxReceipt$,
        get AUTH () { return RougeAuthorization },
        get rgeAddress () { return rgeAddress },
        get rge () { return rgeInstance },
        get factoryAddress () { return factoryAddress },
        get factory () { return factoryInstance },
        get factoryVersion () { return factoryVersion$() },
        get tare () { return factoryTare$() },
        get balance () { return balanceOf$(context.account.address) },
        get account () { return account.address },
        get options () { return context.options },
        // rougeQR,
        // getFuelBalance,
        // as, => user object
        createCampaign,
        getCampaigns,
        sendFinney,
        campaignAt
      })
    )
  })
}

export default RougeProtocol
