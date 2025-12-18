import React from "react";
import { AdminConfig } from "webiny/admin/configs";
import { ReactComponent as SquareLogo } from "./logos/webiny-square.svg";
import { ReactComponent as HorizontalLogo } from "./logos/webiny-horizontal.svg";

const { Tenant } = AdminConfig;

export const Extension = () => {
    return (
        <>
            <AdminConfig.Public>
                <Tenant>
                    <Tenant.Name value={"Webiny"} />
                    <Tenant.Logo
                        squareLogo={<SquareLogo />}
                        horizontalLogo={<HorizontalLogo width={180} />}
                    />
                </Tenant>
            </AdminConfig.Public>
        </>
    );
};
