import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { ReactComponent as SquareLogo } from "./Tenant/wby-square.svg";
import { ReactComponent as HorizontalLogo } from "./Tenant/wby-horizontal.svg";

export const Tenant = React.memo(() => {
    const { Title, Logo } = AdminConfig;
    return (
        <AdminConfig.Public>
            <Title value={"Webiny"} />
            <Logo
                squareLogo={<SquareLogo alt={"Webiny"} width={32} />}
                horizontalLogo={<HorizontalLogo width={175} />}
            />
        </AdminConfig.Public>
    );
});

Tenant.displayName = "Tenant";
