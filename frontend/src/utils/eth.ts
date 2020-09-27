import Web3 from 'web3'
import { provider } from 'web3-core'

export const getWalletBalance = async (
  provider: provider,
  userAddress: string,
): Promise<string> => {
  try {
    const web3 = new Web3(provider)
    const balance = await web3.eth.getBalance(userAddress)
    return balance
  } catch (e) {
    return '0'
  }
}
