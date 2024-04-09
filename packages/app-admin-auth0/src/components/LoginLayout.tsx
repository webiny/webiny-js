import * as React from "react";
import { Logo, makeDecoratable } from "@webiny/app-admin";
import { Elevation } from "@webiny/ui/Elevation";
import { LoginContent, LogoWrapper, Wrapper, InnerContent } from "./StyledComponents";

export interface LoginLayoutProps {
    children: React.ReactNode;
}

export const LoginLayout = makeDecoratable("LoginLayout", ({ children }: LoginLayoutProps) => (
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
