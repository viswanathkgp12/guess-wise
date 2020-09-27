import { useCallback } from 'react'
import { Contract } from 'web3-eth-contract'
import { useWallet } from 'use-wallet'

import { stakeForOption } from '../core/utils'

const useStakeForOption = (
  predictionMarketContract: Contract,
  marketId: number,
  optionNo: number,
) => {
  const { account }: { account: string; } = useWallet()

  const handleStake = useCallback(async () => {
    const txHash = await stakeForOption(
      predictionMarketContract,
      account,
      marketId,
      optionNo,
    )
    console.log(txHash)

    return txHash
  }, [account, marketId, optionNo, predictionMarketContract])

  return { onStake: handleStake }
}

export default useStakeForOption
