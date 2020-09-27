import { useCallback } from 'react'
import { Contract } from 'web3-eth-contract'
import { claimWinnings } from '../core/utils'

const useClaimWinnings = (
  predictionMarketContract: Contract,
  marketId: number,
  account: string,
) => {
  const handleClaimUserWinnings = useCallback(async () => {
    const txHash = await claimWinnings(
      predictionMarketContract,
      account,
      marketId,
    )
    console.log(txHash)

    return txHash
  }, [account, marketId, predictionMarketContract])

  return { onClaimUserWinnings: handleClaimUserWinnings }
}

export default useClaimWinnings
