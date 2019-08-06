
export const delay = t => new Promise(resolve => setTimeout(resolve, t))

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

// workaround : web3 1.0 return sometimes receipt.status = true/false, sometimes '0x1'/'0x0''

export const successfulTransact = receipt => (receipt.status || receipt.status === '0x1')
