import React from 'react'
import styled from 'styled-components'
import { useWallet } from 'use-wallet'
import { Switch } from 'react-router-dom'
import Button from '../../components/Button'
import Page from '../../components/Page'

import WalletProviderModal from '../../components/WalletProviderModal'

import useModal from '../../hooks/useModal'

const Home: React.FC = () => {
  const { account } = useWallet()
  const [onPresentWalletProviderModal] = useModal(<WalletProviderModal />)

  return (
    <Switch>
      <Page>
        {!!account ? (
          <>
            <StyledInfo>
              🏆<b>Coming Soon!!!</b>
            </StyledInfo>
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

export default Home
