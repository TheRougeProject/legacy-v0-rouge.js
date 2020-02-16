
import RGEToken from 'rouge-protocol-solidity/build/contracts/RGETokenInterface.json'
import RougeFactory from 'rouge-protocol-solidity/build/contracts/RougeFactory.json'
import SimpleRougeCampaign from 'rouge-protocol-solidity/build/contracts/SimpleRougeCampaign.json'

import { RougeProtocolAddress, RougeAuthorization } from './constants'
import { universalAccount, universalScheme, sendTransaction, transact, successfulTransact } from './internalUtils'

import RougeUtils from './utils'

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

  if (!web3) {
    throw new Error('RougeProtocol: please provide Web3.js context to initiate')
  }

  if (web3.fromWei && web3.fromWei) {
    web3 = { version: '1.utilsOnly', utils: web3 }
  }

  if (!/^1./.test(web3.version)) {
    throw new Error('rouge.js: can only be used with web3js 1.x')
  }

  const _utils = () => RougeUtils(web3.utils)
  const _transact = (...args) => transact(web3, context, ...args)

  const RGE$address = async () => (context.rge || RougeProtocolAddress[await web3.eth.net.getId()].rge)
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

  if (web3.net) control()

  const _AbiEvents = {}
  RougeFactory.abi.reduce((acc, d) => {
    if (d.type === 'event') acc[d.name] = d
    return acc
  }, _AbiEvents)
  SimpleRougeCampaign.abi.reduce((acc, d) => {
    if (d.type === 'event') acc[d.name] = d
    return acc
  }, _AbiEvents)

  const _decodeLog = (name, log) => ({
    _event: name,
    _address: log.address,
    _blockNumber: log.blockNumber,
    _transactionHash: log.transactionHash,
    _log: log,
    ...web3.eth.abi.decodeLog(_AbiEvents[name].inputs, log.data, log.topics.slice(1))
  })

  const account$ = () => Object.freeze({
    get address () { return context.as.address }
    // get RGE$balanceOf () { return balanceOf$(context.account.address) }
  })

  const campaign$ = address => Campaign(web3, address, { context, _decodeLog })

  const createCampaign = async (params = {}) => {
    if (!params.issuance) params.issuance = 1
    if (!params.tokens) {
      const tare = web3.utils.toBN(await factory$tare())
      params.tokens = web3.utils.toBN(params.issuance).mul(tare)
    }
    const { issuance, tokens, scheme, ...args } = { scheme: context.scheme, ...params }
    try {
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

      if (!successfulTransact(receipt)) throw new Error('tx failed')

      const campaign = campaign$(NewCampaign.campaign)
      return await campaign.issue({ scheme, ...args })
    } catch (e) {
      throw new Error(`[rouge.js] createCampaign failed: ${e}`)
    }
  }

  // const getCampaignList = async ({issuer}) => {
  // // NewCampaign TODO add in protocol issuer + version protocol
  // TODO add in protocol issuer + version protocol
  const getIssuedCampaignList = async ({scheme, issuer}) => {
    // TODO issuer // protocol version filter
    try {
      const abiSignEvent = web3.eth.abi.encodeEventSignature(_AbiEvents['Issuance'])
      const encodedScheme = web3.utils.padRight(scheme, 64)
      const logs = await web3.eth.getPastLogs({
        fromBlock: 1, // 4056827, should be factory/version create block by default per network ?
        topics: [abiSignEvent, encodedScheme]
      })
      return Promise.resolve(logs.map(log => _decodeLog('Issuance', log)))
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] getIssuedCampaignList failed: ${e}`))
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
    get util$ () { return _utils() },
    // get options$$ () { return context.options },
    // protocol object with properties (non Promise & end with $) // no blockchain mutation & no pipe
    get AUTH$ () { return RougeAuthorization },
    get RGE$ () { return RGE$ },
    get factory$ () { return factory$ },
    get account$ () { return account$() },
    campaign$,
    // verb => potential mutation, always return Promise, pipe always end
    createCampaign,
    // getCampaignList,
    getIssuedCampaignList,
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

  $.version = '__version__'
  return Object.freeze($).as(context.as)
}

export default RougeProtocol
