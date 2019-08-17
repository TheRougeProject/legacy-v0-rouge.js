
import abi from 'ethereumjs-abi'

import SimpleRougeCampaign from 'rouge-protocol-solidity/build/contracts/SimpleRougeCampaign.json'

import { universalAccount, transact, successfulTransact } from './utils'
import { authHash, authHashProtocolSig } from './authUtils'
import { RougeAuthorization } from './constants'

export default function Campaign (web3, address, { context, _decodeLog }) {

  const _transact = (...args) => transact(web3, context, ...args)

  const instance = new web3.eth.Contract(SimpleRougeCampaign.abi, address, {})

  const version = async () => instance.methods.version().call()
  const tare = async () => instance.methods.tare().call()

  // TODO cache information from getInfo
  const info = async () => instance.methods.getInfo().call()
  const issuer = async () => instance.methods.issuer().call()
  const scheme = async () => instance.methods.scheme().call()
  const expiration = async () => instance.methods.campaignExpiration().call()
  const name = async () => instance.methods.name().call()

  const state = async () => instance.methods.getState().call()
  const isIssued = async () => instance.methods.campaignIssued().call()
  const issuance = async () => instance.methods.issuance().call()
  const available = async () => instance.methods.available().call()
  const acquired = async () => instance.methods.acquired().call()
  const redeemed = async () => instance.methods.redeemed().call()

  const isAuthorized = async (address, auth) => (await instance.methods.isAuthorized(
    address, RougeAuthorization.All
  ).call()) || instance.methods.isAuthorized(
    address, auth
  ).call()

  const canAttach = () => isAuthorized(context.as.address, RougeAuthorization.Attachment)
  const canIssue = () => isAuthorized(context.as.address, RougeAuthorization.Issuance)
  const canDistribute = () => isAuthorized(context.as.address, RougeAuthorization.Acquisition)
  const canSignRedemption = () => isAuthorized(context.as.address, RougeAuthorization.Redemption)
  const canKill = () => isAuthorized(context.as.address, RougeAuthorization.Kill)

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

  const addAttestor = async ({attestor, auths}) => new Promise(async (resolve, reject) => {
    try {
      attestor = universalAccount(web3, attestor)
      // XXX check syntax attestor + auths
      const method = instance.methods.addAttestor(attestor.address, auths)
      // ! BUG in web3 1.0 (instance.abiModel.abi.methods.addAttestor) doesn't include Array
      const encoded = '0x' + abi.simpleEncode(
        'addAttestor(address,uint8[])', attestor.address, auths
      ).toString('hex')

      const receipt = await _transact(method, address, 46842, encoded)
      if (!successfulTransact(receipt)) throw new Error('can\'t change authorization. [addAttestor]')
      resolve(true)
    } catch (e) {
      reject(e)
    }
  })

  const removeAttestor = async ({attestor, auths}) => new Promise(async (resolve, reject) => {
    try {
      attestor = universalAccount(web3, attestor)
      // XXX check syntax attestor + auths
      const method = instance.methods.removeAttestor(attestor.address, auths)
      // ! BUG in web3 1.0 (instance.abiModel.abi.methods.addAttestor) doesn't include Array
      const encoded = '0x' + abi.simpleEncode(
        'addAttestor(address,uint8[])', attestor.address, auths
      ).toString('hex')

      const receipt = await _transact(method, address, 46842, encoded)
      if (!successfulTransact(receipt)) throw new Error('can\'t change authorization. [removeAttestor]')
      resolve(true)
    } catch (e) {
      reject(e)
    }
  })

  const attachFuel = async bearer => Promise.reject(new Error('not implement'))
  const attachERC20 = async bearer => Promise.reject(new Error('not implement'))
  const attachERC721 = async bearer => Promise.reject(new Error('not implement'))

  const _issue = async ({
    name = '',
    scheme = context.scheme,
    // two weeks
    expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
    attestor,
    auths
  }) => new Promise(async (resolve, reject) => {
    try {
      let method
      let encoded
      // check expiration
      // TODO check attestor & grant syntax/rules
      if (attestor && auths) {
        encoded = '0x' + abi.simpleEncode(
          'issueWithAttestor(bytes4,string,uint,address,uint8[])', scheme, name, expiration, attestor, auths
        ).toString('hex')
        method = instance.methods.issueWithAttestor(scheme, name, expiration, attestor, auths)
      } else {
        method = instance.methods.issue(scheme, name, expiration)
      }

      const receipt = await _transact(method, address, null, encoded)

      // const Issuance = _decodeLog('Issuance', receipt2.logs[0])
      // console.log("Issuance", Issuance)

      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const issueWithAttestor = async bearer => Promise.reject(new Error('not implement'))

  const distributeNote = async bearer => new Promise(async (resolve, reject) => {
    try {
      // TODO test bearer != as if (rouge.validationMode)
      const method = instance.methods.distributeNote(bearer)
      const receipt = await _transact(method, address)
      // console.log(receipt)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [distributeNote]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const acquireNote = async (attestor, signedAuth) => new Promise(async (resolve, reject) => {
    try {
      // TODO test attestor != as if (rouge.validationMode)
      // TODO test attestor canDistribute if (rouge.validationMode)
      const auth = authHash('acceptAcquisition', address, context.as.address)
      const method = instance.methods.acquire(auth, signedAuth.v, signedAuth.r, signedAuth.s, attestor)
      const receipt = await _transact(method, address)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [acquireNote]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const redeemNote = async (attestor, signedAuth) => new Promise(async (resolve, reject) => {
    try {
      attestor = universalAccount(web3, attestor)
      // TODO test attestor != as if (rouge.validationMode)
      // TODO test attestor canRedeem if (rouge.validationMode)
      const auth = authHash('acceptRedemption', address, context.as.address)
      const method = instance.methods.redeem(auth, signedAuth.v, signedAuth.r, signedAuth.s, attestor.address)
      const receipt = await _transact(method, address)
      // console.log(receipt)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [redeemNote]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const acceptRedemption = async (bearer, signedAuth) => new Promise(async (resolve, reject) => {
    try {
      bearer = universalAccount(web3, bearer)
      const auth = authHash('acceptRedemption', address, bearer.address)
      const method = instance.methods.acceptRedemption(auth, signedAuth.v, signedAuth.r, signedAuth.s, bearer.address)
      const receipt = await _transact(method, address)
      // console.log(receipt)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [acceptRedemption]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const kill = async () => new Promise(async (resolve, reject) => {
    try {
      const method = instance.methods.kill()
      const receipt = await _transact(method, address)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [acceptRedemption]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const _generateSignedAuth = (message, account) => {
    account = universalAccount(web3, account)
    // if context.as == account throw
    return authHashProtocolSig(message, address, account.address, context.as.privateKey)
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
    isAuthorized,
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
