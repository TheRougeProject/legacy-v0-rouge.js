
export const universalAccount = (web3, arg) => {
  if (typeof arg === 'object') {
    // TODO regexp pkey)
    if (arg.pkey) {
      return web3.eth.accounts.privateKeyToAccount(arg.pkey)
    } else {
      return arg
    }
  }
  if (typeof arg === 'string') return { address: arg }
  // throw new Error('can\'t determine account with value: ' + arg)
  return {}
}

export const universalScheme = (web3, arg) => {
  if (typeof arg === 'object') {
    return arg
  }
  return {}
}

export const sendTransaction = async (web3, context, rawTx) => {
  if (context.as.privateKey) {
    const signed = await context.as.signTransaction(rawTx) // web3 1.2.1 ok
    // using Promise / TODO switch PromiEvent // mode
    return web3.eth.sendSignedTransaction(signed.rawTransaction)
  } else {
    return web3.eth.sendTransaction({ from: context.as.address, ...rawTx })
  }
}

export const transact = async (web3, context, method, to, estimate, encoded) => {
  try {
    // possible workaround if incorrect ABI encoding &/or estimate...
    if (!estimate) estimate = await method.estimateGas({ from: context.as.address })
    if (!encoded) encoded = await method.encodeABI()
    // workaround issues https://github.com/ethereum/web3.js/issues/2441
    // https://github.com/ethereum/web3.js/issues/3175
    if (context.web3jsworkaroundoutofgas) estimate = estimate + 1
    const rawTx = {
      gasPrice: web3.utils.toHex(web3.utils.toWei(context.options.gasPrice, 'gwei')),
      gasLimit: web3.utils.toHex(estimate),
      to: to,
      value: '0x00',
      data: encoded
    }
    return sendTransaction(web3, context, rawTx)
  } catch (e) {
    throw new Error(`[rouge.js] transact failed: ${e}`)
  }
}

// workaround : web3 1.0 return sometimes receipt.status = true/false, sometimes '0x1'/'0x0''

export const successfulTransact = receipt => (receipt && (receipt.status || receipt.status === '0x1'))
