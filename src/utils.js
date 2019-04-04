
// workaround : web3 1.0 return sometimes receipt.status = true/false, sometimes '0x1'/'0x0''

export const successfulTransact = receipt => (receipt.status || receipt.status === '0x1')
