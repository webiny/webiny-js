import React from "react";
import { LogoRenderer, useAdminConfig } from "@webiny/app-admin";
import { useIsInNavigation } from "@webiny/app-admin";

const minHeight = { minHeight: 48 };

export const Logo = LogoRenderer.createDecorator(() => {
    return function Logo() {
        const { logo } = useAdminConfig();
        const isInNavigation = useIsInNavigation();

        const logoElement = isInNavigation ? logo.squareLogo : logo.horizontalLogo;

        return <div style={minHeight}>{logoElement || null}</div>;
    };
});
