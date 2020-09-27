import React, { useCallback, useState } from 'react'
import useStakeForOption from '../../../hooks/useStakeForOption'
import { Contract } from 'web3-eth-contract'
import Button from '../../../components/Button'

interface StakeProps {
  predictionContract: Contract
  marketId: number
  optionNo: number
}

const Stake: React.FC<StakeProps> = ({
  predictionContract,
  marketId,
  optionNo,
}) => {
  const [requestedApproval, setRequestedApproval] = useState(false)

  const { onStake } = useStakeForOption(predictionContract, marketId, optionNo)

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      const txHash = await onStake()
      // user rejected tx or didn't go thru
      if (!txHash) {
        setRequestedApproval(false)
      }

      return txHash
    } catch (e) {
      console.log(e)
    }
  }, [onStake, setRequestedApproval])

  return (
    <Button
      // disabled={requestedApproval}
      onClick={handleApprove}
      text={`Predict`}
    />
  )
}

export default Stake
