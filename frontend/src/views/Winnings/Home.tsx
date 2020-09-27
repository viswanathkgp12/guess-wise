import React, { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'

import styled from 'styled-components'
import { useWallet } from 'use-wallet'
import { Switch } from 'react-router-dom'
import Button from '../../components/Button'
import Page from '../../components/Page'
import Spacer from '../../components/Spacer'
import Loader from '../../components/Loader'
import { getAllUserStakes, getPredictionMarketContract } from '../../core/utils'
import WalletProviderModal from '../../components/WalletProviderModal'
import usePredictionMkt from '../../hooks/usePredictionMkt'
import { getDisplayBalance } from '../../utils/formatBalance'
import { unixToDate } from '../../utils'
import Claim from './components/Claim'

import useModal from '../../hooks/useModal'

interface UserStake {
  _user: string
  _marketId: number
  _optionNo: number
  _amount: BigNumber
  _marketPairs?: {
    fromToken: string
    toToken: string
  }
  _marketState?: string
  _optionDetails?: {
    startPrice: number
    endPrice: number
  }
  _marketDetails?: number
}

const Home: React.FC = () => {
  const { account } = useWallet()
  const [onPresentWalletProviderModal] = useModal(<WalletProviderModal />)
  const [userStakes, setUserStakes] = useState<UserStake[]>()
  const [predictionMktContract, setPredictionMktContract] = useState()

  const predictionMkt = usePredictionMkt()

  useEffect(() => {
    async function fetchUserStakes() {
      try {
        const _userStakes = await getAllUserStakes(
          getPredictionMarketContract(predictionMkt),
          account,
        )

        setPredictionMktContract(getPredictionMarketContract(predictionMkt))
        setUserStakes(_userStakes)
      } catch (e) {
        console.log(e)
      }
    }
    if (predictionMkt) {
      fetchUserStakes()
    }
  }, [predictionMkt, setUserStakes])

  return (
    <Switch>
      <Page>
        {!!account ? (
          <>
            <Spacer size="lg" />
            <StyledTable>
              <thead>
                <StyledTableRow>
                  <StyledTableHeader>ID</StyledTableHeader>
                  <StyledTableHeader>Markets</StyledTableHeader>
                  <StyledTableHeader>Prediction</StyledTableHeader>
                  <StyledTableHeader>Amount Staked</StyledTableHeader>
                  <StyledTableHeader>Market Status</StyledTableHeader>
                  <StyledTableHeader>Pending Actions</StyledTableHeader>
                </StyledTableRow>
              </thead>
              <tbody>
                {!!userStakes && !!userStakes.length ? (
                  userStakes.map((userStake, i) => (
                    <StyledTableRow key={i}>
                      <StyledTableData>{userStake._marketId}</StyledTableData>
                      <StyledTableData>
                        {userStake._marketPairs?.fromToken}
                        {'/'}
                        {userStake._marketPairs?.toToken} at{' '}
                        {unixToDate(userStake._marketDetails)}
                      </StyledTableData>
                      <StyledTableData>
                        {userStake._optionDetails?.startPrice}-
                        {userStake._optionDetails?.endPrice}{' '}
                        {userStake._marketPairs?.toToken}
                      </StyledTableData>
                      <StyledTableData>
                        {getDisplayBalance(userStake._amount)} ETH
                      </StyledTableData>
                      <StyledTableData>
                        {userStake._marketState === 'OPEN' ? (
                          'Ongoing'
                        ) : userStake._marketState !== 'RESOLVED' ? (
                          'Awaiting resolution'
                        ) : (
                          <Claim
                            predictionContract={predictionMktContract}
                            marketId={userStake._marketId}
                            account={account}
                          />
                        )}
                      </StyledTableData>
                      <StyledTableData>{'-'}</StyledTableData>
                    </StyledTableRow>
                  ))
                ) : (
                  <>
                    {!!userStakes ? (
                      <StyledTableRow>
                        <StyledTableData>{'      '}</StyledTableData>
                        <StyledTableData>{'      '}</StyledTableData>
                        <StyledTableData>{'      '}</StyledTableData>
                        <StyledTableData>No data found</StyledTableData>
                        <StyledTableData>{'        '}</StyledTableData>
                        <StyledTableData>{'        '}</StyledTableData>
                      </StyledTableRow>
                    ) : (
                      <StyledTableRow>
                        <StyledTableData>{'      '}</StyledTableData>
                        <StyledTableData>{'      '}</StyledTableData>
                        <StyledTableData>{'      '}</StyledTableData>
                        <StyledTableDataLoader>
                          <Loader />
                        </StyledTableDataLoader>
                        <StyledTableData>{'        '}</StyledTableData>
                        <StyledTableData>{'        '}</StyledTableData>
                      </StyledTableRow>
                    )}
                  </>
                )}
              </tbody>
            </StyledTable>
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

const StyledTable = styled.table`
  width: 80%;
  border-collapse: collapse;
  border-spacing: 2px;
  border: 1px solid #939da7;
`

const StyledTableRow = styled.tr`
  border-bottom: 1px solid #939da7;
  padding: 16px 0;
`

const StyledTableData = styled.td`
  text-align: center;
  color: #939da7;
  padding: 16px 0;
  min-width: 50px;
`

const StyledTableDataLoader = styled.td`
  text-align: center;
  padding: 16px 0;
  min-width: 50px;
`

const StyledTableHeader = styled.th`
  color: #fff;
  padding: 16px 0;
`

export default Home
