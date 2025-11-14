import React from "react";
import { AdminConfig } from "@webiny/app-serverless-cms"; // TODO: webiny/admin/config?
import logo from "./logo.png";

const { Tenant } = AdminConfig;

export const Extension = () => {
    return (
        <>
            <AdminConfig>
                <Tenant>
                    <Tenant.Name value={"My Tenant X"} />
                    <Tenant.Logo element={<img src={logo} alt={"Webiny"} />} />
                </Tenant>
            </AdminConfig>
        </>
    );
};
