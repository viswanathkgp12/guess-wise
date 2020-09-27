import BigNumber from 'bignumber.js'
import React, { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'
import Card from '../../../components/Card'
import CardContent from '../../../components/CardContent'
import Stake from './Stake'

import {
  getPredictionMarketContract,
  getMarketDetails,
  getOptionDetails,
  getAllActiveMarkets,
  getMarketPairs,
  getAllUserStakes,
} from '../../../core/utils'
import usePredictionMkt from '../../../hooks/usePredictionMkt'
import { unixToDate } from '../../../utils'
import { getDisplayBalance } from '../../../utils/formatBalance'

interface MarketProps {
  account: string
  marketId: number
  fromToken: string
  toToken: string
}

const Market: React.FC<MarketProps> = ({
  account,
  marketId,
  fromToken,
  toToken,
}) => {
  const [totalStakedOpt1, setTotalStakedOpt1] = useState<BigNumber>()
  const [totalStakedOpt2, setTotalStakedOpt2] = useState<BigNumber>()
  const [totalStakedOpt3, setTotalStakedOpt3] = useState<BigNumber>()
  const [expiresAt, setExpiresAt] = useState()
  const [forecastAt, setForecastAt] = useState()
  const [opt1StartPrice, setOpt1StartPrice] = useState<BigNumber>()
  const [opt2StartPrice, setOpt2StartPrice] = useState<BigNumber>()
  const [opt3StartPrice, setOpt3StartPrice] = useState<BigNumber>()
  const [opt1EndPrice, setOpt1EndPrice] = useState<BigNumber>()
  const [opt2EndPrice, setOpt2EndPrice] = useState<BigNumber>()
  const [opt3EndPrice, setOpt3EndPrice] = useState<BigNumber>()

  const predictionMkt = usePredictionMkt()

  const predictionMktContract = useMemo(() => {
    return getPredictionMarketContract(predictionMkt)
  }, [predictionMkt])

  useEffect(() => {
    async function fetchMarket() {
      const promises: Promise<any>[] = [
        getMarketDetails(predictionMktContract, marketId),
        getOptionDetails(predictionMktContract, marketId, 1),
        getOptionDetails(predictionMktContract, marketId, 2),
        getOptionDetails(predictionMktContract, marketId, 3),
      ]

      const [marketData, opt1Data, opt2Data, opt3Data] = await Promise.all(
        promises,
      )

      getMarketPairs(predictionMktContract, marketId)
      getAllActiveMarkets(predictionMktContract)
      getAllUserStakes(predictionMktContract, account)

      const {
        _aggregatorAddress,
        _totalStakedOpt1,
        _totalStakedOpt2,
        _totalStakedOpt3,
        _opensAt,
        _closesAt,
        _forecastTime,
      } = marketData

      setTotalStakedOpt1(_totalStakedOpt1)
      setTotalStakedOpt2(_totalStakedOpt2)
      setTotalStakedOpt3(_totalStakedOpt3)
      setExpiresAt(_closesAt)
      setForecastAt(_forecastTime)

      setOpt1StartPrice(opt1Data.startPrice)
      setOpt1EndPrice(opt1Data.endPrice)

      setOpt2StartPrice(opt2Data.startPrice)
      setOpt2EndPrice(opt2Data.endPrice)

      setOpt3StartPrice(opt3Data.startPrice)
      setOpt3EndPrice(opt3Data.endPrice)
    }
    if (predictionMktContract) {
      fetchMarket()
    }
  }, [predictionMktContract, account, marketId])

  return (
    <StyledWrapper>
      <Card>
        <CardContent>
          <StyledText>
            {`What will be the value of ${fromToken} / ${toToken} at ${
              forecastAt ? unixToDate(forecastAt) : 'UNKNOWN'
            }?`}
          </StyledText>
        </CardContent>

        <table>
          <thead>
            <tr>
              <StyledTableHeader>Options</StyledTableHeader>
              <StyledTableHeader>Stakes</StyledTableHeader>
              <StyledTableHeader>Option Price</StyledTableHeader>
              <StyledTableHeader></StyledTableHeader>
            </tr>
          </thead>
          <tbody>
            <tr>
              <StyledTableData>
                ${opt1StartPrice ? opt1StartPrice : 0} - $
                {opt1EndPrice ? opt1EndPrice : 0}
              </StyledTableData>
              <StyledTableData>
                {totalStakedOpt1
                  ? getDisplayBalance(new BigNumber(totalStakedOpt1))
                  : 0}{' '}
                ETH
              </StyledTableData>
              <StyledTableData>0.003 ETH</StyledTableData>
              <StyledTableData>
                <Stake
                  predictionContract={predictionMktContract}
                  marketId={marketId}
                  optionNo={1}
                />
              </StyledTableData>
            </tr>

            <tr>
              <StyledTableData>
                ${opt2StartPrice ? opt2StartPrice : 0} - $
                {opt2EndPrice ? opt2EndPrice : 0}
              </StyledTableData>
              <StyledTableData>
                {totalStakedOpt2
                  ? getDisplayBalance(new BigNumber(totalStakedOpt2))
                  : 0}{' '}
                ETH
              </StyledTableData>
              <StyledTableData>0.003 ETH</StyledTableData>
              <StyledTableData>
                <Stake
                  predictionContract={predictionMktContract}
                  marketId={marketId}
                  optionNo={2}
                />
              </StyledTableData>
            </tr>

            <tr>
              <StyledTableData>
                ${opt3StartPrice ? opt3StartPrice : 0} - $
                {opt3EndPrice ? opt3EndPrice : 0}
              </StyledTableData>
              <StyledTableData>
                {totalStakedOpt3
                  ? getDisplayBalance(new BigNumber(totalStakedOpt3))
                  : 0}{' '}
                ETH
              </StyledTableData>
              <StyledTableData>0.003 ETH</StyledTableData>
              <StyledTableData>
                <Stake
                  predictionContract={predictionMktContract}
                  marketId={marketId}
                  optionNo={3}
                />
              </StyledTableData>
            </tr>
          </tbody>
        </table>
        <Footnote>
          Predictions close at:
          <FootnoteValue>
            {expiresAt ? unixToDate(expiresAt) : 'UNKNOWN'}
          </FootnoteValue>
        </Footnote>
      </Card>
    </StyledWrapper>
  )
}

const Footnote = styled.div`
  font-size: 14px;
  padding: 8px 20px;
  color: ${(props) => props.theme.color.grey[400]};
  border-top: solid 1px #37b06f;
`
const FootnoteValue = styled.div`
  font-family: 'Roboto Mono', monospace;
  float: right;
`

const StyledWrapper = styled.div`
  align-items: center;
  display: flex;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: stretch;
  }
`

const StyledText = styled.span`
  display: flex;
  justify-content: center;
  color: ${(props) => props.theme.color.grey[400]};
  font-size: 19px;
`

const StyledTableData = styled.td`
  text-align: center;
  color: #939da7;
  padding: 5px 10px;
`

const StyledTableHeader = styled.th`
  color: #fff;
`

export default Market
