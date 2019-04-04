
import abi from 'ethereumjs-abi'

import SimpleRougeCampaign from '@/contracts/SimpleRougeCampaign.json'

import { successfulTransact } from './utils'
import { authHash } from './authUtils'
import { RougeAuthorization } from './constants'

// account is Object with web3 1.x structure :
// https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#

export default function Campaign ({ web3, account, transact$, account$ }, address) {
  const instance = new web3.eth.Contract(SimpleRougeCampaign.abi, address, {})

  const version$ = async () => instance.methods.version().call()

  const info$ = async () => instance.methods.getInfo().call()
  const expiration$ = async () => instance.methods.campaignExpiration().call()
  const issuance$ = async () => instance.methods.issuance().call()

  const state$ = async () => instance.methods.getState().call()
  const available$ = async () => instance.methods.available().call()
  const acquired$ = async () => instance.methods.acquired().call()
  const redeemed$ = async () => instance.methods.redeemed().call()

  const isAuthorized$ = async (address, auth) => instance.methods.isAuthorized(
    address, auth
  ).call()

  const canDistribute$ = async () => instance.methods.isAuthorized(
    account.address, RougeAuthorization.Acquisition
  ).call()

  const canRedeem$ = async () => instance.methods.isAuthorized(
    account.address, RougeAuthorization.Redemption
  ).call()

  const hasNote$ = async bearer => { // TODO cleanup
    const res = await instance.methods.hasNote(bearer).call()
    // workaround web1.0
    if (typeof res === 'object' && res.yes) return res.yes
    return res
  }
  const hasRedeemed$ = async bearer => { // TODO cleanup
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
      attestor = account$(attestor)
      // XXX check syntax attestor + auths
      const method = instance.methods.addAttestor(attestor.address, auths)
      // ! BUG in web3 1.0 (instance.abiModel.abi.methods.addAttestor) doesn't include Array
      const encoded = '0x' + abi.simpleEncode(
        'addAttestor(address,uint8[])', attestor.address, auths
      ).toString('hex')

      const receipt = await transact$(method, address, 46842, encoded)
      if (!successfulTransact(receipt)) throw new Error('can\'t change authorization. [addAttestor]')
      resolve(true)
    } catch (e) {
      reject(e)
    }
  })

  const distributeNote = async bearer => new Promise(async (resolve, reject) => {
    try {
      // TODO test bearer != account if (rouge.validationMode)
      const method = instance.methods.distributeNote(bearer)
      const receipt = await transact$(method, address)
      // console.log(receipt)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [distributeNote]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const acquireNote = async (attestor, signedAuth) => new Promise(async (resolve, reject) => {
    try {
      // TODO test attestor != account if (rouge.validationMode)
      // TODO test attestor canDistribute if (rouge.validationMode)
      const auth = authHash('acceptAcquisition', address, account.address)
      const method = instance.methods.acquire(auth, signedAuth.v, signedAuth.r, signedAuth.s, attestor)
      const receipt = await transact$(method, address)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [acquireNote]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  const redeemNote = async (attestor, signedAuth) => new Promise(async (resolve, reject) => {
    try {
      // TODO test attestor != account if (rouge.validationMode)
      // TODO test attestor canRedeem if (rouge.validationMode)
      const auth = authHash('acceptRedemption', address, account.address)
      const method = instance.methods.redeem(auth, signedAuth.v, signedAuth.r, signedAuth.s, attestor)
      const receipt = await transact$(method, address)
      // console.log(receipt)
      if (!successfulTransact(receipt)) throw new Error('transact failed. [acquireNote]')
      resolve(receipt)
    } catch (e) {
      reject(e)
    }
  })

  // const result = await this.rouge.acquire(sign, attestor) // todo implement
  // await coupon.acquire(auth, sign.v, sign.r, sign.s, attestor, {from: this.account})

  return Object.freeze({
    distributeNote,
    acquireNote,
    redeemNote,
    addAttestor,
    expiration$,
    available$,
    hasNote$,
    isAuthorized$,
    get address () { return address },
    get version () { return version$() },
    get info () { return info$() },
    get expiration () { return expiration$() },
    get issuance () { return issuance$() },
    get state () { return state$() },
    get available () { return available$() },
    get acquired () { return acquired$() },
    get redeemed () { return redeemed$() },
    get canDistribute () { return canDistribute$() },
    get canRedeem () { return canRedeem$() },
    get hasNote () { return hasNote$(account.address) },
    get hasRedeemed () { return hasRedeemed$(account.address) },
    bearerHasNote: address => hasNote$(address),
    getAllEvents
  })
}
