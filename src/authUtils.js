
const Web3 = require('web3')
const ethers = require('ethers')
const secp256k1 = require('ethers/utils/secp256k1.js')

const hex64 = require('hex64')

export const authHash = (msg, campaign, bearer) => Web3.utils.soliditySha3(
  {t: 'string', v: msg}, {t: 'address', v: campaign}, {t: 'address', v: bearer}
)

export const authHashProtocolSig = (msg, campaign, bearer, privateKey) => {
  const hash = authHash(msg, campaign, bearer)
  const digest = ethers.utils.hashMessage(Web3.utils.hexToBytes(
    Web3.utils.utf8ToHex('Rouge ID: ' + hash.substr(2))
  ))
  return new ethers.SigningKey(privateKey).signDigest(digest)
}

export function authHashRpcSig (msg, campaign, bearer, privateKey) {
  // check pkey with 0x
  const hash = authHash(msg, campaign, bearer)
  return ethers.utils.joinSignature(
    new ethers.SigningKey(privateKey).signDigest(Web3.utils.hexToBytes(hash))
  )
}

export function rougeQR (msg, campaign, bearer, privateKey) {
  // check pkey with 0x
  const rpcSig = authHashRpcSig(msg, campaign, bearer, privateKey)
  return hex64.toBase64(bearer.substr(2) + rpcSig.substr(2) + Web3.utils.utf8ToHex(msg).substr(2))
}

function checkSignature (msg, campaign, bearer, signature) {
  const hash = authHash(msg, campaign, bearer)
  const recovered = secp256k1.recoverAddress(
    hash,
    ethers.utils.splitSignature(signature)
  )
  return recovered.toLowerCase() === bearer.toLowerCase()
}

export function decodeRougeQR (code, getCampaign) {
  const raw = hex64.toHex(code)
  const bearer = '0x' + raw.slice(0, 40)
  const signature = '0x' + raw.slice(40, 170)
  const msg = Web3.utils.hexToAscii('0x' + raw.slice(170, raw.length))
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
