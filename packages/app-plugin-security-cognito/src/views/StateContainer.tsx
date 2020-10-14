import { CognitoViewLogoPlugin } from "@webiny/app-plugin-security-cognito-theme/admin/types";
import * as React from "react";
import { LoginContent, Logo, Wrapper } from "./StyledComponents";
import { plugins } from "@webiny/plugins";
import logoOrange from "./webiny-orange-logo.svg";

const StateContainer = ({ children }) => {
    const logoPlugin = plugins.byName<CognitoViewLogoPlugin>("cognito-view-logo");
    const LogoComponent = logoPlugin?.component;
    return (
        <Wrapper>
            {LogoComponent ? <LogoComponent /> : <Logo src={logoPlugin?.src || logoOrange} />}
            <LoginContent>{children}</LoginContent>
        </Wrapper>
    );
};

export default StateContainer;
