import React from "react";
import { AdminConfig } from "webiny/admin/configs";

const { Theme } = AdminConfig;

export const Extension = () => {
    return (
        <AdminConfig.Public>
            <Theme.Color palette={"primary"} color={"purple"} />
            <Theme.Color palette={"secondary"} color={"green"} />
        </AdminConfig.Public>
    );
};
