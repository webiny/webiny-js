import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { ReactComponent as SquareLogo } from "./Tenant/wby-square.svg";
import { ReactComponent as HorizontalLogo } from "./Tenant/wby-horizontal.svg";

export const Tenant = React.memo(() => {
    const { Tenant } = AdminConfig;
    return (
        <AdminConfig.Public>
            <Tenant.Name value={"Webiny"} />
            <Tenant.Logo
                squareLogo={<SquareLogo alt={"Webiny"} />}
                horizontalLogo={<HorizontalLogo width={175} />}
            />
        </AdminConfig.Public>
    );
});

Tenant.displayName = "Tenant";
