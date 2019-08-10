
import RGEToken from 'rouge-protocol-solidity/build/contracts/RGETokenInterface.json'
import RougeFactory from 'rouge-protocol-solidity/build/contracts/RougeFactory.json'
import SimpleRougeCampaign from 'rouge-protocol-solidity/build/contracts/SimpleRougeCampaign.json'

import { RougeProtocolAddress, RougeAuthorization } from './constants'
import { successfulTransact, universalAccount, universalScheme, delay } from './utils'

// import abi from 'ethereumjs-abi'

import Campaign from './campaign'

const defaultContext = {
  options: {
    gasPrice: '1'
  },
  // TODO automatic scheme management
  scheme: '0x0001ffff'
}

// account is Object with web3 1.x structure :
// https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#

function RougeProtocol (web3, context = {}) {
  context = { ...defaultContext, ...context }

  /* TODO better check valid web3 */
  if (!/^1./.test(web3.version)) {
    throw new Error('beta rouge.js can only be used with web3js 1.x')
  }

  const RGE$address = async () => RougeProtocolAddress[await web3.eth.net.getId()].rge
  const RGE$web3instance = async () => new web3.eth.Contract(RGEToken.abi, await RGE$address(), {})
  const RGE$balanceOf = async address => (await RGE$web3instance()).methods.balanceOf(address).call()

  // end with $ = non Promise object
  const RGE$ = Object.freeze({
    get address () { return RGE$address() },
    get web3instance () { return RGE$web3instance() },
    balanceOf: RGE$balanceOf
  })

  const factory$address = async () => (await RGE$web3instance()).methods.factory().call()
  const factory$web3instance = async () => new web3.eth.Contract(RougeFactory.abi, await factory$address())
  const factory$rgeAddress = async () => (await factory$web3instance()).methods.rge().call()
  const factory$version = async () => (await factory$web3instance()).methods.version().call()
  const factory$tare = async () => (await factory$web3instance()).methods.tare().call()

  const factory$ = Object.freeze({
    get address () { return factory$address() },
    get web3instance () { return factory$web3instance() },
    get version () { return factory$version() },
    get tare () { return factory$tare() }
    // get balance () { return balanceOf$(context.account.address) }
    // get RGEbalance () { return factory$RGEbalance() },
  })

  const control = async () => {
    if ((await RGE$address()).toLowerCase() !== (await factory$rgeAddress()).toLowerCase()) {
      throw new Error('RGE protocol not ready: rge address not set in factory')
    }
    // TODO check event SetFactory(address indexed _rge, uint256 _tare) => store first block active factory
  }

  control()

  const _AbiEvents = {}
  RougeFactory.abi.reduce((acc, d) => {
    if (d.type === 'event') acc[d.name] = d
    return acc
  }, _AbiEvents)
  SimpleRougeCampaign.abi.reduce((acc, d) => {
    if (d.type === 'event') acc[d.name] = d
    return acc
  }, _AbiEvents)

  const _decodeLog = (name, log) => web3.eth.abi.decodeLog(_AbiEvents[name].inputs, log.data, log.topics.slice(1))

  const account$ = () => Object.freeze({
    get address () { return context.as.address }
    // get RGE$balanceOf () { return balanceOf$(context.account.address) }
  })

  const campaign$ = address => Campaign(web3, address, { context, _transact, _decodeLog })

  const getTxReceipt$ = hash => new Promise(async resolve => {
    const receipt = await web3.eth.getTransactionReceipt(hash)
    if (receipt) {
      resolve(receipt)
    } else {
      await delay(2000)
      resolve(await getTxReceipt$(hash))
    }
  })

  // starting with _ = internal fct
  function _sendTransaction (rawTx) {
    return new Promise(async (resolve, reject) => {
      try {
        // send is returning PromiEvent // use callback -- most stable solution atm
        /* Event not yet working beta46 to beta51
           .on(
           'receipt', function (receipt) {
           resolve(receipt)
           }) */
        if (context.as.privateKey) {
          const signed = await context.as.signTransaction(rawTx) // web3.0 > beta51 ok
          // fallback beta46
          // const signed2 = await web3.eth.accounts.signTransaction(rawTx, context.as.privateKey)
          web3.eth.sendSignedTransaction(signed.rawTransaction, async (error, hash) => {
            if (error) {
              throw new Error('transact failed.')
            } else {
              resolve(await getTxReceipt$(hash))
            }
          })
        } else {
          web3.eth.sendTransaction({ from: context.as.address, ...rawTx }, async (error, hash) => {
            if (error) {
              throw new Error('transact failed.')
            } else {
              resolve(await getTxReceipt$(hash))
            }
          })
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  function _transact (method, to, estimate, encoded) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!estimate) estimate = await method.estimateGas({ from: context.as.address })
        // workaround incorrect ABI encoding...
        if (!encoded) encoded = await method.encodeABI()
        const rawTx = {
          gasPrice: web3.utils.toHex(web3.utils.toWei(context.options.gasPrice, 'gwei')),
          gasLimit: web3.utils.toHex(estimate),
          to: to,
          value: '0x00',
          data: encoded
        }
        return resolve(await _sendTransaction(rawTx))
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })
  }

  const createCampaign = ({
    issuance = 1,
    tokens,
    scheme = context.scheme,
    ...args
  }) => new Promise(async (resolve, reject) => { // eslint-line-disable no-async-promise-executor
    try {
      if (!tokens) {
        const tare = web3.utils.toBN(await factory$tare())
        tokens = web3.utils.toBN(issuance).mul(tare)
      }
      // always check if enough token ? only if check options
      // check enought RGE
      const method = (await RGE$web3instance()).methods.newCampaign(issuance, tokens.toString())
      const receipt = await _transact(method, await RGE$address())

      // Log[0] transfer RGE to factory
      // Log[1] SimpleRougeCampaign : attestorAddition(issuer, Authorization.All);
      // Log[2] transfer RGE to Campaign
      // Log[3] RougeFactory : NewCampaign(_issuer, c, _issuance);

      const NewCampaign = _decodeLog('NewCampaign', receipt.logs[3])
      // console.log('NewCampaign', NewCampaign)

      if (!successfulTransact(receipt)) throw new Error('can\'t instanciate new campaign.')

      const campaign = campaign$(NewCampaign.campaign)
      resolve(campaign.issue({ ...args }))
    } catch (e) {
      reject(e)
    }
  })

  const getCampaignList = ({scheme, issuer}) => new Promise(async (resolve, reject) => {
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
      recipient = universalAccount(web3, recipient)
      const rawTx = {
        gasPrice: web3.utils.toHex(web3.utils.toWei(context.options.gasPrice, 'gwei')),
        gasLimit: web3.utils.toHex(21000),
        to: recipient.address,
        value: web3.utils.toHex(web3.utils.toWei(fuel, 'finney'))
      }
      return resolve(await _sendTransaction(rawTx))
    } catch (e) {
      reject(e)
      // throw new Error('error sending sendFinney. [sendFinney]')
    }
  })

  const $ = {
    // get options$$ () { return context.options },
    // set alteernative (account) { context.as = universalAccount(web3, account) },
    // getTxReceipt$,
    // protocol object with properties (non Promise & end with $) // no blockchain mutation & no pipe
    get AUTH$ () { return RougeAuthorization },
    get RGE$ () { return RGE$ },
    get factory$ () { return factory$ },
    get account$ () { return account$() },
    campaign$,
    // verb => potentially mutation, always return Promise, pipe always end
    createCampaign,
    getCampaignList,
    // return Promise true/false or PromiEvent ?
    sendFinney
  }

  // noun => change object context, no Promise

  $.scheme = code => {
    // use description or hex
    context.scheme = universalScheme(code)
    return Object.freeze($)
  }

  $.as = account => {
    context.as = universalAccount(web3, account)
    return Object.freeze($)
  }

  return $.as(context.as)
}

export default RougeProtocol
