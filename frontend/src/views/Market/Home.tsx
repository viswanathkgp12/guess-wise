import React, { useState, useEffect } from 'react'
import { useWallet } from 'use-wallet'
import styled from 'styled-components'
import { Switch } from 'react-router-dom'
import Button from '../../components/Button'
import Container from '../../components/Container'
import Page from '../../components/Page'
import Spacer from '../../components/Spacer'
import Market from './components/Market'
import TradingView from './components/TradingView'
import {
  getPredictionMarketContract,
  getAllActiveMarkets,
} from '../../core/utils'
import WalletProviderModal from '../../components/WalletProviderModal'

import useModal from '../../hooks/useModal'
import usePredictionMkt from '../../hooks/usePredictionMkt'
import Loader from '../../components/Loader'
import Label from '../../components/Label'

interface Market {
  fromToken: string
  toToken: string
  marketId: any
}

const Home: React.FC = () => {
  const { account } = useWallet()
  const [onPresentWalletProviderModal] = useModal(<WalletProviderModal />)
  const [markets, setMarkets] = useState<Market[]>()

  const predictionMkt = usePredictionMkt()

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const activeMarkets = await getAllActiveMarkets(
          getPredictionMarketContract(predictionMkt),
        )

        setMarkets(activeMarkets)
      } catch (e) {
        console.log(e)
      }
    }
    if (predictionMkt) {
      fetchMarkets()
    }
  }, [predictionMkt, setMarkets])

  return (
    <Switch>
      <Page>
        {!!account ? (
          <>
            {!!markets && !!markets.length ? (
              markets.map((market, i) => (
                <>
                  <StyledRow key={i}>
                    <Spacer size="lg" />

                    <Container>
                      <Market
                        account={account}
                        marketId={market.marketId}
                        fromToken={market.fromToken}
                        toToken={market.toToken}
                      />
                      <TradingView
                        fromToken={market.fromToken}
                        toToken={market.toToken}
                      />
                    </Container>

                    <Spacer size="lg" />
                  </StyledRow>

                  <div
                    style={{
                      margin: '0 auto',
                    }}
                  >
                    <Button
                      text="🏆 See the Leaderboard"
                      to="/leaderboard"
                      variant="secondary"
                    />
                  </div>
                </>
              ))
            ) : (
              <>
                {!!markets ? (
                  <>
                    <Spacer size="lg" />
                    <StyledInfo>
                      <b>No markets active!!!</b>
                    </StyledInfo>

                    <div
                      style={{
                        margin: '0 auto',
                      }}
                    >
                      <Button
                        text="🏆 See the Leaderboard"
                        to="/leaderboard"
                        variant="secondary"
                      />
                    </div>

                    <Spacer size="lg" />
                  </>
                ) : (
                  <>
                    <Spacer size="lg" />
                    <Loader />
                    <Spacer size="lg" />
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              onClick={onPresentWalletProviderModal}
              text="🔓 Unlock Wallet"
            />
          </div>
        )}
      </Page>
    </Switch>
  )
}

export default Home

const StyledRow = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column-reverse;
  width: 100%;
`

const StyledInfo = styled.div`
  color: ${(props) => props.theme.color.grey[500]};
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  padding: 0;
  align-items: center;
  display: flex;
  flex: 1;
  justify-items: center;
  justify-content: center;
  > b {
    color: ${(props) => props.theme.color.grey[600]};
  }
`
