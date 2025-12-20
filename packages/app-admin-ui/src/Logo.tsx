import React from "react";
import { LogoRenderer, useAdminConfig } from "@webiny/app-admin";
import { useIsInNavigation } from "@webiny/app-admin";

const minHeight = { minHeight: 48 };

export const Logo = LogoRenderer.createDecorator(() => {
    return function Logo() {
        const { tenant } = useAdminConfig();
        const isInNavigation = useIsInNavigation();

        const logo = isInNavigation ? tenant.squareLogo : tenant.horizontalLogo;

        return <div style={minHeight}>{logo || null}</div>;
    };
});
