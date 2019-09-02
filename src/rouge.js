
import RGEToken from 'rouge-protocol-solidity/build/contracts/RGETokenInterface.json'
import RougeFactory from 'rouge-protocol-solidity/build/contracts/RougeFactory.json'
import SimpleRougeCampaign from 'rouge-protocol-solidity/build/contracts/SimpleRougeCampaign.json'

import { RougeProtocolAddress, RougeAuthorization } from './constants'
import { universalAccount, universalScheme, sendTransaction, transact, successfulTransact } from './utils'

import Campaign from './campaign'

const defaultPromiEventCallback = (eventName, e) => {
  console.log(eventName, e)
}

const defaultContext = {
  options: {
    gasPrice: '1'
  },
  // TODO automatic scheme management
  scheme: '0x0001ffff',
  mode: 'chaining',
  onceTransactionHash: x => defaultPromiEventCallback('onceTransactionHash', x),
  onceReceipt: x => defaultPromiEventCallback('onceReceipt', x),
  onConfirmation: x => defaultPromiEventCallback('onConfirmation', x),
  onError: x => defaultPromiEventCallback('onError', x)
}

// account is Object with web3 1.x structure :
// https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#

function RougeProtocol (web3, context = {}) {
  context = { ...defaultContext, ...context }

  /* TODO better check valid web3 */
  if (!/^1./.test(web3.version)) {
    throw new Error('beta rouge.js can only be used with web3js 1.x')
  }

  const _transact = (...args) => transact(web3, context, ...args)

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

  const campaign$ = address => Campaign(web3, address, { context, _decodeLog })

  const createCampaign = async ({
    issuance = 1,
    tokens,
    scheme = context.scheme,
    ...args
  }) => {
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

      if (!successfulTransact(receipt)) Promise.reject(new Error(`[rouge.js] createCampaign tx failed`))

      const campaign = campaign$(NewCampaign.campaign)
      await campaign.issue({ scheme, ...args })

      return Promise.resolve(campaign)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] createCampaign failed: ${e}`))
    }
  }

  const getCampaignList = async ({scheme, issuer}) => {
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
      return Promise.resolve(logs.map(log => log.address))
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] getCampaignList failed: ${e}`))
    }
  }

  const sendFinney = async ({fuel, recipient}) => {
    try {
      recipient = universalAccount(web3, recipient)
      const rawTx = {
        gasPrice: web3.utils.toHex(web3.utils.toWei(context.options.gasPrice, 'gwei')),
        gasLimit: web3.utils.toHex(21000),
        to: recipient.address,
        value: web3.utils.toHex(web3.utils.toWei(fuel, 'finney'))
      }
      return sendTransaction(web3, context, rawTx)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] sendFinney failed: ${e}`))
    }
  }

  const $ = {
    // get options$$ () { return context.options },
    // protocol object with properties (non Promise & end with $) // no blockchain mutation & no pipe
    get AUTH$ () { return RougeAuthorization },
    get RGE$ () { return RGE$ },
    get factory$ () { return factory$ },
    get account$ () { return account$() },
    campaign$,
    // verb => potential mutation, always return Promise, pipe always end
    createCampaign,
    getCampaignList,
    sendFinney
  }

  // noun => change object context, no Promise

  // mode
  // 1. chaining => Promisent is passed to handler
  // 2. web3 => return PromiEvent
  // 3. async => return standard Promise on tx

  $.setMode = mode => {
    if (['chaining', 'web3', 'async'].includes(mode)) {
      // use description or hex
      context.mode = mode
      return $
    } else {
      throw new Error(`mode ${mode} does not exist`)
    }
  }

  $.setScheme = code => {
    // use description or hex
    context.scheme = universalScheme(code)
    return $
  }

  $.as = account => {
    context.as = universalAccount(web3, account)
    return $
  }

  return Object.freeze($).as(context.as)
}

export default RougeProtocol
