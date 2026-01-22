import React from "react";
import { AdminConfig } from "webiny/admin/configs";

const { Theme } = AdminConfig;

const AdminTheme = () => {
    return (
        <AdminConfig.Public>
            <Theme.Color palette={"primary"} color={"purple"} />
            <Theme.Color palette={"secondary"} color={"green"} />
        </AdminConfig.Public>
    );
};

export default AdminTheme;
