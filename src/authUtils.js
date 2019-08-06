
const ethUtils = require('ethereumjs-util')
const BN = ethUtils.BN
const abi = require('ethereumjs-abi')
const hex64 = require('hex64')

export function authHash (msg, campaign, bearer) {
  // return '0x' + abi.soliditySHA3(
  return '0x' + ethUtils.keccak(abi.solidityPack(
    ['string', 'address', 'address'], [msg, new BN(campaign, 16), new BN(bearer, 16)]
  )).toString('hex')
}

export function authHashProtocolSig (msg, campaign, bearer, privateKey) {
  const hash = authHash(msg, campaign, bearer)
  const signature = ethUtils.ecsign(ethUtils.hashPersonalMessage(
    ethUtils.toBuffer('Rouge ID: ' + hash.substr(2))
  ), ethUtils.toBuffer(privateKey))
  return {
    r: ethUtils.bufferToHex(signature.r),
    s: ethUtils.bufferToHex(signature.s),
    v: signature.v
  }
}

export function authHashRpcSig (msg, campaign, bearer, privateKey) {
  // check pkey with 0x
  const hash = authHash(msg, campaign, bearer)
  const signature = ethUtils.ecsign(ethUtils.toBuffer(hash), ethUtils.toBuffer(privateKey))
  return ethUtils.toRpcSig(signature.v, signature.r, signature.s)
}

export function rougeQR (msg, campaign, bearer, privateKey) {
  // check pkey with 0x
  const rpcSig = authHashRpcSig(msg, campaign, bearer, privateKey)
  return hex64.toBase64(bearer.substr(2) + rpcSig.substr(2) + ethUtils.bufferToHex(ethUtils.toBuffer(msg)).substr(2))
}

function checkSignature (msg, campaign, bearer, signature) {
  const hash = authHash(msg, campaign, bearer)
  const {r, s, v} = ethUtils.fromRpcSig(signature)
  const recovered = ethUtils.bufferToHex(ethUtils.pubToAddress(
    ethUtils.ecrecover(ethUtils.toBuffer(hash), v, ethUtils.toBuffer(r), ethUtils.toBuffer(s))
  ))
  return recovered === bearer
}

export function decodeRougeQR (code, getCampaign) {
  const raw = hex64.toHex(code)
  const bearer = '0x' + raw.slice(0, 40)
  const signature = '0x' + raw.slice(40, 170)
  const msg = ethUtils.toAscii(raw.slice(170, raw.length))
  const campaign = getCampaign(msg, bearer)
  if (!/^0x[0-9a-f]{40}$/i.test(campaign)) throw new Error('Invalid Rouge QR code')
  if (/^0x[0-9a-f]{40}$/i.test(bearer) &&
      /^0x[0-9a-f]{130}$/i.test(signature)) {
    if (checkSignature(msg, campaign, bearer, signature)) {
      return {msg, campaign, bearer}
    } else {
      throw new Error('Invalid Rouge QR signature')
    }
  } else {
    throw new Error('Invalid Rouge QR code')
  }
}
