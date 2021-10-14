import React from "react";
import { ReactComponent as TenantIcon } from "../assets/business_black_24dp.svg";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { useSecurity } from "@webiny/app-security";

const TenantManagerMenu = ({ Menu, Section, Item }) => {
    const security = useSecurity();

    const { currentTenant } = security.identity;

    if (currentTenant.id !== "root") {
        return null;
    }

    return (
        <Menu name="app-tenant-manager" label={`Tenant Manager`} icon={<TenantIcon />}>
            <Section label={`Tenant Manager`}>
                <Item label={`Tenants`} path="/tenants" />
            </Section>
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
