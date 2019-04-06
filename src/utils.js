
export const delay = t => new Promise(resolve => setTimeout(resolve, t))

export const universalAccount = arg => {
  if (typeof arg === 'object') return arg
  if (typeof arg === 'string') return { address: arg }
  // throw new Error('can\'t determine account with value: ' + arg)
  return {}
}

// workaround : web3 1.0 return sometimes receipt.status = true/false, sometimes '0x1'/'0x0''

export const successfulTransact = receipt => (receipt.status || receipt.status === '0x1')
