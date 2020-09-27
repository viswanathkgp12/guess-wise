import React, { createContext, useEffect, useState } from 'react'

import { useWallet } from 'use-wallet'

import { PredictionMarket } from '../../core/PredictionMarket'

export interface PredictionMktContext {
  predictionMkt?: typeof PredictionMarket
}

export const Context = createContext<PredictionMktContext>({
  predictionMkt: undefined,
})

declare global {
  interface Window {
    predictionMKtLib: any
  }
}

const PredictionMarketProvider: React.FC = ({ children }) => {
  const { ethereum }: { ethereum: any } = useWallet()
  const [predictionMKt, setPredictionMarket] = useState<any>()

  // @ts-ignore
  window.predictionMKt = predictionMKt
  // @ts-ignore
  window.eth = ethereum

  useEffect(() => {
    if (ethereum) {
      const chainId = Number(ethereum.chainId)
      const predictionMktLib = new PredictionMarket(ethereum, chainId, false, {
        defaultAccount: ethereum.selectedAddress,
        defaultConfirmations: 1,
        autoGasMultiplier: 1.5,
        testing: false,
        defaultGas: '6000000',
        defaultGasPrice: '1000000000000',
        accounts: [],
        ethereumNodeTimeout: 10000,
      })
      setPredictionMarket(predictionMktLib)
      window.predictionMKtLib = predictionMktLib
    }
  }, [ethereum])

  return (
    <Context.Provider value={{ predictionMkt: predictionMKt }}>
      {children}
    </Context.Provider>
  )
}

export default PredictionMarketProvider
