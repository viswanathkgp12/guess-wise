import React from 'react'
import styled from 'styled-components'

interface TradingViewProps {
  fromToken: string
  toToken: string
}

const TradingView: React.FC<TradingViewProps> = ({ fromToken, toToken }) => {
  return (
    <StyledWrapper>
      <iframe
        title={`${fromToken} - ${toToken}`}
        id="tradingview_2de07"
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_2de07&symbol=BINANCE%3A${fromToken}${toToken}&interval=H&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=in&utm_source=alpha.plotx.io&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE%3A${fromToken}${toToken}`}
        style={{
          width: '100%',
          height: '100%',
          margin: '0 !important',
          padding: '0 !important',
        }}
        frameBorder={0}
        scrolling="no"
        allowFullScreen
      />
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  align-items: center;
  display: flex;
  position: relative;
  box-sizing: content-box;
  height: 350px;
  margin: 0 auto !important;
  padding: 0 !important;
  font-family: Arial, sans-serif;
`

export default TradingView
