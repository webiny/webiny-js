import React from "react";
import { ReactComponent as TenantIcon } from "../assets/business_black_24dp.svg";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { useSecurity } from "@webiny/app-security";

const TenantManagerMenu = ({ Menu, Item }) => {
    const security = useSecurity();

    const { currentTenant } = security.identity;

    if (currentTenant.id !== "root") {
        return null;
    }

    return (
        <Menu name="app-tenant-manager" label={`Tenant Manager`} icon={<TenantIcon />}>
            <Item label={`Tenants`} path="/tenants" />
        </Menu>
    );
};

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "admin-menu-tenant-manager",
    render(props) {
        return <TenantManagerMenu {...props} />;
    }
};

export default plugin;
