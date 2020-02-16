
import SimpleRougeCampaign from 'rouge-protocol-solidity/build/contracts/SimpleRougeCampaign.json'

import { universalAccount, transact, successfulTransact } from './internalUtils'
import { RougeAuthorization } from './constants'

import RougeUtils from './utils'

export default function Campaign (web3, address, { context, _decodeLog }) {

  const _transact = (...args) => transact(web3, context, ...args)

  const instance = new web3.eth.Contract(SimpleRougeCampaign.abi, address, {})

  const version = async () => instance.methods.version().call()
  const tare = async () => instance.methods.tare().call()

  // TODO cache information from getInfo
  const infoRaw = async () => instance.methods.getInfo().call()
  const issuer = async () => instance.methods.issuer().call()
  const scheme = async () => instance.methods.scheme().call()
  const expiration = async () => instance.methods.campaignExpiration().call()
  const name = async () => instance.methods.name().call()

  const info = async () => {
    const data = await infoRaw()
    return {
      issuer: web3.utils.toChecksumAddress(data.slice(0, 42)),
      scheme: '0x' + data.slice(42, 50),
      expiration: web3.utils.hexToNumber('0x' + data.slice(50, 114)),
      name: web3.utils.hexToAscii('0x' + data.slice(114))
    }
  }

  const stateRaw = async () => instance.methods.getState().call()
  const isIssued = async () => instance.methods.campaignIssued().call()
  const issuance = async () => instance.methods.issuance().call()
  const available = async () => instance.methods.available().call()
  const acquired = async () => instance.methods.acquired().call()
  const redeemed = async () => instance.methods.redeemed().call()

  const state = async () => {
    const data = await stateRaw()
    const result = {
      issued: web3.utils.hexToNumber('0x' + data.slice(10, 12)) > 0
    }
    if (result.issued) {
      result.issuance = web3.utils.hexToNumber(data.slice(0, 10))
      result.free = web3.utils.hexToNumber('0x' + data.slice(12, 20))
      result.acquired = web3.utils.hexToNumber('0x' + data.slice(20, 28))
      result.redeemed = web3.utils.hexToNumber('0x' + data.slice(28, 36))
    }
    return result
  }

  const _isAuthorized = async (address, auth) => (await instance.methods.isAuthorized(
    address, RougeAuthorization.All
  ).call()) || instance.methods.isAuthorized(
    address, auth
  ).call()

  const canAttach = () => _isAuthorized(context.as.address, RougeAuthorization.Attachment)
  const canIssue = () => _isAuthorized(context.as.address, RougeAuthorization.Issuance)
  const canDistribute = () => _isAuthorized(context.as.address, RougeAuthorization.Acquisition)
  const canSignRedemption = () => _isAuthorized(context.as.address, RougeAuthorization.Redemption)
  const canKill = () => _isAuthorized(context.as.address, RougeAuthorization.Kill)

  const hasNote = async bearer => { // TODO cleanup
    const res = await instance.methods.hasNote(bearer).call()
    // workaround web1.0
    if (typeof res === 'object' && res.yes) return res.yes
    return res
  }
  const hasRedeemed = async bearer => { // TODO cleanup
    const res = await instance.methods.hasRedeemed(bearer).call()
    // workaround web1.0
    if (typeof res === 'object' && res.yes) return res.yes
    return res
  }

  function getAllEvents () {
    return instance.getPastEvents('allEvents', {
      fromBlock: 0,
      toBlock: 'latest'
    })
  }

  const addAttestor = async ({attestor, auths}) => {
    try {
      attestor = universalAccount(web3, attestor)
      const method = instance.methods.addAttestor(attestor.address, auths)
      const receipt = await _transact(method, address)
      if (!successfulTransact(receipt)) throw new Error('tx not successful')
      return Promise.resolve(true)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] addAttestor failed: ${e}`))
    }
  }

  const removeAttestor = async ({attestor, auths}) => {
    try {
      attestor = universalAccount(web3, attestor)
      const method = instance.methods.removeAttestor(attestor.address, auths)
      const receipt = await _transact(method, address)
      if (!successfulTransact(receipt)) throw new Error('tx not successful')
      return Promise.resolve(true)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] removeAttestor failed: ${e}`))
    }
  }

  const attachFuel = async bearer => Promise.reject(new Error('[rouge.js] not implement'))
  const attachERC20 = async bearer => Promise.reject(new Error('[rouge.js] not implement'))
  const attachERC721 = async bearer => Promise.reject(new Error('[rouge.js] not implement'))

  const _issue = async ({
    name = '',
    scheme = context.scheme,
    // two weeks
    expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
    attestor,
    auths
  }) => {
    try {
      let method
      // let encoded
      // check expiration
      // TODO check attestor & grant syntax/rules
      if (attestor && auths) {
        // encoded = '0x' + abi.simpleEncode(
        //   'issueWithAttestor(bytes4,string,uint,address,uint8[])', scheme, name, expiration, attestor, auths
        // ).toString('hex')
        method = instance.methods.issueWithAttestor(scheme, name, expiration, attestor, auths)
      } else {
        method = instance.methods.issue(scheme, name, expiration)
      }

      const receipt = await _transact(method, address)
      // const Issuance = _decodeLog('Issuance', receipt.logs[0])
      return receipt
    } catch (e) {
      throw new Error(`[rouge.js] issueCampaign failed: ${e}`)
    }
  }

  const issueWithAttestor = async bearer => Promise.reject(new Error('[rouge.js] not implement'))

  const distributeNote = async bearer => {
    try {
      // TODO test bearer != as if (rouge.validationMode)
      const method = instance.methods.distributeNote(bearer)
      const receipt = await _transact(method, address)
      if (!successfulTransact(receipt)) throw new Error('tx not successful')
      return Promise.resolve(receipt)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] distributeNote failed: ${e}`))
    }
  }

  const acquireNote = async (attestor, signedAuth) => {
    try {
      // TODO test attestor != as if (rouge.validationMode)
      // TODO test attestor canDistribute if (rouge.validationMode)
      const auth = RougeUtils(web3.utils).authHash('acceptAcquisition', address, context.as.address)
      const method = instance.methods.acquire(auth, signedAuth.v, signedAuth.r, signedAuth.s, attestor)
      const receipt = await _transact(method, address)
      if (!successfulTransact(receipt)) throw new Error('tx not successful')
      return Promise.resolve(receipt)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] distributeNote failed: ${e}`))
    }
  }

  const redeemNote = async (attestor, signedAuth) => {
    try {
      attestor = universalAccount(web3, attestor)
      // TODO test attestor != as if (rouge.validationMode)
      // TODO test attestor canRedeem if (rouge.validationMode)
      const auth = RougeUtils(web3.utils).authHash('acceptRedemption', address, context.as.address)
      const method = instance.methods.redeem(auth, signedAuth.v, signedAuth.r, signedAuth.s, attestor.address)
      const receipt = await _transact(method, address)
      // console.log(receipt)
      if (!successfulTransact(receipt)) throw new Error('tx not successful')
      return Promise.resolve(receipt)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] redeemNote failed: ${e}`))
    }
  }

  const acceptRedemption = async (bearer, signedAuth) => {
    try {
      bearer = universalAccount(web3, bearer)
      const auth = RougeUtils(web3.utils).authHash('acceptRedemption', address, bearer.address)
      const method = instance.methods.acceptRedemption(auth, signedAuth.v, signedAuth.r, signedAuth.s, bearer.address)
      const receipt = await _transact(method, address)
      // console.log(receipt)
      if (!successfulTransact(receipt)) throw new Error('tx not successful')
      return Promise.resolve(receipt)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] acceptRedemption failed: ${e}`))
    }
  }

  const kill = async () => {
    try {
      const method = instance.methods.kill()
      const receipt = await _transact(method, address)
      if (!successfulTransact(receipt)) throw new Error('tx not successful')
      return Promise.resolve(receipt)
    } catch (e) {
      return Promise.reject(new Error(`[rouge.js] kill failed: ${e}`))
    }
  }

  const _generateSignedAuth = (message, account) => {
    account = universalAccount(web3, account)
    // if context.as == account throw
    return RougeUtils(web3.utils).authHashProtocolSig(message, address, account.address, context.as.privateKey)
  }

  const $ = {
    acceptAcquisitionSig$: account => _generateSignedAuth('acceptAcquisition', account),
    acceptRedemptionSig$: account => _generateSignedAuth('acceptRedemption', account),
    removeAttestor,
    addAttestor,
    attachFuel,
    attachERC20,
    attachERC721,
    issueWithAttestor,
    acquireNote,
    distributeNote,
    redeemNote,
    acceptRedemption,
    kill,
    get address () { return Promise.resolve(address) },
    get tare () { return tare() },
    get version () { return version() },

    get info () { return info() },
    get issuer () { return issuer() },
    get scheme () { return scheme() },
    get expiration () { return expiration() },
    get name () { return name() },

    get state () { return state() },
    get issuance () { return issuance() },
    get isIssued () { return isIssued() },
    get available () { return available() },
    get acquired () { return acquired() },
    get redeemed () { return redeemed() },

    get canAttach () { return canAttach() },
    get canIssue () { return canIssue() },
    get canDistribute () { return canDistribute() },
    get canSignRedemption () { return canSignRedemption() },
    get canKill () { return canKill() },

    get hasNote () { return hasNote(context.as.address) },
    get hasRedeemed () { return hasRedeemed(context.as.address) },
    bearerHasNote: address => hasNote(address),
    getAllEvents
  }

  $.as = account => {
    context.as = universalAccount(web3, account)
    return $
  }

  $.issue = async args => {
    const receipt = await _issue(args)
    if (!successfulTransact(receipt)) throw new Error('can\'t issue campaign.')
    return $
  }

  return Object.freeze($)
}
