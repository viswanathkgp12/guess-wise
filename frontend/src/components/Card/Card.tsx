import React from 'react'
import styled from 'styled-components'

const Card: React.FC = ({ children }) => <StyledCard>{children}</StyledCard>

const StyledCard = styled.div`
  background: linear-gradient(to bottom, #2b3943, #1A242B);
  border-radius: 12px;
  box-shadow: inset 1px 1px 0px solid #37B06F;
  display: flex;
  flex: 1;
  flex-direction: column;
`

export default Card
