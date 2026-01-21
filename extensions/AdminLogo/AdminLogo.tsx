import React from "react";
import { AdminConfig } from "webiny/admin/configs";
import { ReactComponent as SquareLogo } from "./webiny-square.svg";
import { ReactComponent as HorizontalLogo } from "./webiny-horizontal.svg";

const { Title, Logo } = AdminConfig;

export const AdminLogo = () => {
    return (
        <>
            <AdminConfig.Public>
                <Title value={"Webiny"} />
                <Logo
                    squareLogo={<SquareLogo />}
                    horizontalLogo={<HorizontalLogo width={180} />}
                />
            </AdminConfig.Public>
        </>
    );
};
