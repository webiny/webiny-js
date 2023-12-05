import * as React from "react";
import { Logo } from "@webiny/app-admin";
import { LoginContent, LogoWrapper, Wrapper } from "./StyledComponents";

interface StateContainerProps {
    children: React.ReactNode;
}

const StateContainer: React.FC<StateContainerProps> = ({ children }) => (
    <Wrapper>
        <LogoWrapper>
            <Logo />
        </LogoWrapper>
        <LoginContent>{children}</LoginContent>
    </Wrapper>
);

export default StateContainer;
