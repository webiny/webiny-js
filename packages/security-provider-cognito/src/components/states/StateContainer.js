import * as React from "react";
import { LoginContent, Logo, Wrapper } from "../StyledComponents";
import logoOrange from "../logo_orange.png";

export default ({ children }) => (
    <Wrapper>
        <Logo src={logoOrange} />
        <LoginContent>{children}</LoginContent>
    </Wrapper>
);
