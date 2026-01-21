import React from "react";
import { AdminConfig } from "webiny/admin/configs";
import squareLogo from "./logo.png";
import horizontalLogo from "./logo.png";

const { Title, Logo } = AdminConfig;

export const Extension = () => {
    return (
        <AdminConfig.Public>
            <Title value={"ACME Corp"} />
            <Logo
                squareLogo={<img src={squareLogo} alt={"ACME Corp"} />}
                horizontalLogo={<img src={horizontalLogo} alt={"ACME Corp"} />}
            />
        </AdminConfig.Public>
    );
};
