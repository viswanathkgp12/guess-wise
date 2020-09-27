import { useContext } from 'react'
import { Context } from '../contexts/PredictionMarketProvider'

const usePredictionMkt = () => {
  const { predictionMkt } = useContext(Context)
  return predictionMkt
}

export default usePredictionMkt
