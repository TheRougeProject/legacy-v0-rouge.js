
import { transact } from '../src/internalUtils'

import RGEToken from 'rouge-protocol-solidity/build/contracts/TestRGEToken.json'
import RougeFactory from 'rouge-protocol-solidity/build/contracts/RougeFactory.json'

const defaultTare = 100000
const globalOptions = {
  gasPrice: '100000'
}

const estimateAndDeploy = async contract => contract.deploy().send({ gas: await contract.deploy().estimateGas() })

export const sendTestRGE = (web3, rge, account, amount) =>
  transact(
    web3,
    { as: { address: account }, options: globalOptions },
    rge.methods.giveMeRGE(amount),
    rge.options.address
  )

export const generateRgeMockup = async (web3, owner) => {
  // const $ = {}

  const RGE = new web3.eth.Contract(RGEToken.abi, {
    data: RGEToken.bytecode,
    from: owner,
    ...globalOptions
  })
  const rge = await estimateAndDeploy(RGE)

  const Factory = new web3.eth.Contract(RougeFactory.abi, {
    data: RougeFactory.bytecode,
    from: owner,
    ...globalOptions
  })
  const factory = await estimateAndDeploy(Factory)

  const tx1 = await transact(
    web3,
    { as: {address: owner}, options: globalOptions },
    factory.methods.setParams(rge.options.address, defaultTare),
    factory.options.address
  )
  if (!tx1.status) throw new Error('cannot setParams in factory')

  const tx2 = await transact(
    web3,
    { as: {address: owner}, options: globalOptions },
    rge.methods.setFactory(factory.options.address),
    rge.options.address
  )
  if (!tx2.status) throw new Error('cannot setFactory in RGE')

  return { owner, rge, factory }
}
