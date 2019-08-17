
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
    return arg
  }
  return {}
}

const getTxReceipt$ = (web3, hash) => new Promise(async resolve => {
  const receipt = await web3.eth.getTransactionReceipt(hash)
  if (receipt) {
    resolve(receipt)
  } else {
    await delay(2000)
    resolve(await getTxReceipt$(web3, hash))
  }
})

export const sendTransaction = (web3, context, rawTx) => new Promise(async (resolve, reject) => {
  try {
    // send is returning PromiEvent // use callback -- most stable solution atm
    /* Event not yet working beta46 to beta51
       .on(
       'receipt', function (receipt) {
         resolve(receipt)
         }) */
    if (context.as.privateKey) {
      const signed = await context.as.signTransaction(rawTx) // web3.0 > beta51 ok
      // fallback beta46
      // const signed2 = await web3.eth.accounts.signTransaction(rawTx, context.as.privateKey)
      web3.eth.sendSignedTransaction(signed.rawTransaction, async (error, hash) => {
        if (error) {
          throw new Error('transact failed.')
        } else {
          resolve(await getTxReceipt$(web3, hash))
        }
      })
    } else {
      web3.eth.sendTransaction({ from: context.as.address, ...rawTx }, async (error, hash) => {
        if (error) {
          throw new Error('transact failed.')
        } else {
          resolve(await getTxReceipt$(web3, hash))
        }
      })
    }
  } catch (e) {
    reject(e)
  }
})

export const transact = (web3, context, method, to, estimate, encoded) => new Promise(async (resolve, reject) => {
  try {
    if (!estimate) estimate = await method.estimateGas({ from: context.as.address })
    // workaround incorrect ABI encoding...
    if (!encoded) encoded = await method.encodeABI()
    const rawTx = {
      gasPrice: web3.utils.toHex(web3.utils.toWei(context.options.gasPrice, 'gwei')),
      gasLimit: web3.utils.toHex(estimate),
      to: to,
      value: '0x00',
      data: encoded
    }
    return resolve(await sendTransaction(web3, context, rawTx))
  } catch (e) {
    console.log(e)
    reject(e)
  }
})

// workaround : web3 1.0 return sometimes receipt.status = true/false, sometimes '0x1'/'0x0''

export const successfulTransact = receipt => (receipt.status || receipt.status === '0x1')
