import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

export const getPredictionMarketContract = (predictionMkt) => {
  return (
    predictionMkt &&
    predictionMkt.contracts &&
    predictionMkt.contracts.predictionMkt
  )
}

// ------------------------- Prediction Mkt----
// --------------------------------------------

export const stakeForOption = async (
  predictionMarketContract,
  account,
  marketId,
  optionNo,
) => {
  console.log('Fn ...', predictionMarketContract)
  return predictionMarketContract.methods
    .stake(marketId, optionNo)
    .send({
      from: account,
      value: new BigNumber(0.003).multipliedBy(new BigNumber(10).pow(18)),
    })
    .on('transactionHash', (tx) => {
      console.log(tx)
      return tx.transactionHash
    })
}

export const claimWinnings = async (
  predictionMarketContract,
  account,
  marketId,
) => {
  return predictionMarketContract.methods
    .claimWinnings(marketId)
    .send({ from: account })
    .on('transactionHash', (tx) => {
      console.log(tx)
      return tx.transactionHash
    })
}

export const getMarketPairs = async (predictionMarketContract, marketId) => {
  const res = await predictionMarketContract.methods
    .getMarketPairs(marketId)
    .call()
  const fromToken = ethers.utils.parseBytes32String(res[0])
  const toToken = ethers.utils.parseBytes32String(res[1])

  return {
    fromToken,
    toToken,
  }
}

export const getMarketDetails = async (predictionMarketContract, marketId) => {
  const {
    _aggregatorAddress,
    _totalStakedOpt1,
    _totalStakedOpt2,
    _totalStakedOpt3,
    _opensAt,
    _closesAt,
    _forecastTime,
  } = await predictionMarketContract.methods.getMarket(marketId).call()
  return {
    _aggregatorAddress,
    _totalStakedOpt1,
    _totalStakedOpt2,
    _totalStakedOpt3,
    _opensAt,
    _closesAt,
    _forecastTime,
  }
}

export const getOptionDetails = async (
  predictionMarketContract,
  marketId,
  optionNo,
) => {
  const res = await predictionMarketContract.methods
    .getOptionInfo(marketId, optionNo)
    .call()

  const startPrice = res[0]
  const endPrice = res[1]

  return {
    startPrice,
    endPrice,
  }
}

export const getUserWinnings = async (
  predictionMarketContract,
  marketId,
  account,
) => {
  const winningAmount = await predictionMarketContract.methods
    .getUserWinnings(marketId, account)
    .call()

  return new BigNumber(winningAmount)
}

export const getAllMarkets = async (predictionMarketContract) => {
  const events = await predictionMarketContract.getPastEvents('MarketCreated', {
    fromBlock: 0,
    toBlock: 'latest',
  })

  const marketIds = []

  for (const each of events) {
    marketIds.push(each.returnValues._marketId)
  }

  console.log(marketIds)

  return marketIds
}

// TODO: Bro what did you do?!
export const getAllUserStakes = async (
  predictionMarketContract,
  userAddress,
) => {
  const events = await predictionMarketContract.getPastEvents('UserStaked', {
    filter: { _user: [userAddress] },
    fromBlock: 0,
    toBlock: 'latest',
  })

  const userStakes = []

  for (const each of events) {
    const { _user, _marketId, _optionNo, _amount } = each.returnValues
    userStakes.push({
      _user,
      _marketId: Number(_marketId),
      _optionNo: Number(_optionNo),
      _amount: new BigNumber(_amount),
    })
  }

  const marketPairPromises = []
  for (const each of userStakes) {
    marketPairPromises.push(
      getMarketPairs(predictionMarketContract, each._marketId),
    )
  }

  const mktPairData = await Promise.all(marketPairPromises)

  const marketStatePromises = []
  for (const each of userStakes) {
    marketStatePromises.push(
      getMarketState(predictionMarketContract, each._marketId),
    )
  }

  const mktStateData = await Promise.all(marketStatePromises)

  const optionDetailsPromises = []
  for (const each of userStakes) {
    optionDetailsPromises.push(
      getOptionDetails(
        predictionMarketContract,
        each._marketId,
        each._optionNo,
      ),
    )
  }

  const optnDetails = await Promise.all(optionDetailsPromises)

  const marketDetailsPromises = []
  for (const each of userStakes) {
    marketDetailsPromises.push(
      getMarketDetails(predictionMarketContract, each._marketId),
    )
  }

  const marketDetails = await Promise.all(marketDetailsPromises)

  const compositeIndiceMapping = {}
  let combinedIndex = 0

  const finalStakes = []

  for (let i = 0; i < userStakes.length; i++) {
    const compositeIndex = `${userStakes[i]._marketId}::${userStakes[i]._optionNo}`
    if (compositeIndiceMapping[compositeIndex] === undefined) {
      compositeIndiceMapping[compositeIndex] = combinedIndex

      finalStakes[compositeIndiceMapping[compositeIndex]] = userStakes[i]
      finalStakes[compositeIndiceMapping[compositeIndex]]._marketPairs =
        mktPairData[i]
      finalStakes[compositeIndiceMapping[compositeIndex]]._marketState =
        MarketState[mktStateData[i]]
      finalStakes[compositeIndiceMapping[compositeIndex]]._optionDetails =
        optnDetails[i]
      finalStakes[compositeIndiceMapping[compositeIndex]]._marketDetails =
        marketDetails[i]._forecastTime

      combinedIndex++
    } else {
      finalStakes[compositeIndiceMapping[compositeIndex]]._amount = finalStakes[
        compositeIndiceMapping[compositeIndex]
      ]._amount.plus(userStakes[i]._amount)
    }
  }

  return finalStakes
}

export const MarketState = {
  0: 'CLOSED',
  1: 'OPEN',
  2: 'PENDING_RESOLUTION',
  3: 'RESOLVED',
}

export const getMarketState = async (predictionMarketContract, marketId) => {
  const marketState = await predictionMarketContract.methods
    .getMarketState(marketId)
    .call()

  return marketState
}

export async function getAllActiveMarkets(predictionMarketContract) {
  const allMarkets = await getAllMarkets(predictionMarketContract)

  const promises = []
  allMarkets.forEach((_marketId) => {
    promises.push(getMarketState(predictionMarketContract, _marketId))
  })

  const marketStates = await Promise.all(promises)

  const marketPairsPromises = []
  for (let i = 0; i < marketStates.length; i++) {
    if (MarketState[marketStates[i]] === 'OPEN') {
      marketPairsPromises.push(
        getMarketPairs(predictionMarketContract, allMarkets[i]),
      )
    }
  }
  const activeMarketPairs = await Promise.all(marketPairsPromises)

  const activeMarkets = []

  let activeMktCount = 0

  for (let i = 0; i < marketStates.length; i++) {
    if (MarketState[marketStates[i]] === 'OPEN') {
      activeMarkets.push({
        marketId: allMarkets[i],
        ...activeMarketPairs[activeMktCount++],
      })
    }
  }

  return activeMarkets
}
