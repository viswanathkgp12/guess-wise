import React, { useCallback, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { UseWalletProvider } from 'use-wallet'
import MobileMenu from './components/MobileMenu'
import TopBar from './components/TopBar'
import ModalsProvider from './contexts/Modals'
import TransactionProvider from './contexts/Transactions'
import PredictionMarketProvider from './contexts/PredictionMarketProvider'
import theme from './theme'
import Market from './views/Market'
import Winnings from './views/Winnings'
import Leaderboard from './views/Leaderboard'

const App: React.FC = () => {
  const [mobileMenu, setMobileMenu] = useState(false)

  const handleDismissMobileMenu = useCallback(() => {
    setMobileMenu(false)
  }, [setMobileMenu])

  const handlePresentMobileMenu = useCallback(() => {
    setMobileMenu(true)
  }, [setMobileMenu])

  return (
    <Providers>
      <Router>
        <TopBar onPresentMobileMenu={handlePresentMobileMenu} />
        <MobileMenu onDismiss={handleDismissMobileMenu} visible={mobileMenu} />
        <Switch>
          <Route path="/" exact>
            <Market />
          </Route>
          <Route path="/markets">
            <Market />
          </Route>
          <Route path="/claim-winnings">
            <Winnings />
          </Route>
          <Route path="/leaderboard">
            <Leaderboard />
          </Route>
        </Switch>
      </Router>
    </Providers>
  )
}

const Providers: React.FC = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <UseWalletProvider
        chainId={3}
        connectors={{
          walletconnect: {
            rpcUrl:
              'https://ropsten.infura.io/v3/fac98e56ea7e49608825dfc726fab703',
          },
        }}
      >
        <PredictionMarketProvider>
          <TransactionProvider>
            <ModalsProvider>{children}</ModalsProvider>
          </TransactionProvider>
        </PredictionMarketProvider>
      </UseWalletProvider>
    </ThemeProvider>
  )
}

export default App
