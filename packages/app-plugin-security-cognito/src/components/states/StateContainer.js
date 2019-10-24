import * as React from 'react';
import {LoginContent, Logo, Wrapper} from '../StyledComponents';
import logoOrange from '../webiny-orange-logo.svg';

export default ({children}) => (
  <Wrapper>
    <Logo src={logoOrange} />
    <LoginContent>{children}</LoginContent>
  </Wrapper>
);
