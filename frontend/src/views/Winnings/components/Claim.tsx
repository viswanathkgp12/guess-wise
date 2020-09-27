import React, { useCallback, useState, useEffect } from 'react'
import { Contract } from 'web3-eth-contract'
import Button from '../../../components/Button'
import BigNumber from 'bignumber.js'
import useClaimUserWinnings from '../../../hooks/useClaimUserWinnings'
import { getUserWinnings } from '../../../core/utils'

interface ClaimWinningProps {
  predictionContract: Contract
  marketId: number
  account: string
}

const Claim: React.FC<ClaimWinningProps> = ({
  predictionContract,
  marketId,
  account,
}) => {
  const [winningAmount, setWinningAmount] = useState<BigNumber>()

  const { onClaimUserWinnings } = useClaimUserWinnings(
    predictionContract,
    marketId,
    account
  )

  useEffect(() => {
    async function fetchUserWinnings() {
      try {
        const winningAmountBN = await getUserWinnings(
          predictionContract,
          marketId,
          account,
        )

        setWinningAmount(winningAmountBN)
      } catch (e) {
        console.log(e)
      }
    }
    if (predictionContract) {
      fetchUserWinnings()
    }
  }, [predictionContract, setWinningAmount])

  const handleClaim = useCallback(async () => {
    try {
      const txHash = await onClaimUserWinnings()
      // user rejected tx or didn't go thru

      return txHash
    } catch (e) {
      console.log(e)
    }
  }, [onClaimUserWinnings])

  return !!winningAmount && winningAmount.toNumber() != 0 ? (
    <Button onClick={handleClaim} text={`Claim`} />
  ) : (
    <>Complete</>
  )
}

export default Claim
