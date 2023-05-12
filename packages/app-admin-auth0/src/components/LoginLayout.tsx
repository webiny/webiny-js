import * as React from "react";
import { Logo } from "@webiny/app-admin";
import { Elevation } from "@webiny/ui/Elevation";
import { LoginContent, LogoWrapper, Wrapper, InnerContent } from "./StyledComponents";
import { makeComposable } from "@webiny/app-serverless-cms";

export const LoginLayout: React.FC = makeComposable("LoginLayout", ({ children }) => (
    <Wrapper>
        <LogoWrapper>
            <Logo />
        </LogoWrapper>
        <LoginContent>
            <Elevation z={2}>
                <InnerContent>{children}</InnerContent>
            </Elevation>
        </LoginContent>
    </Wrapper>
));
