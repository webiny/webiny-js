import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";
import { Permission } from "./constants";

const t = i18n.ns("app-security/admin/menus");

const SecurityMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    const groups = identity.getPermission(Permission.Groups);
    const users = identity.getPermission(Permission.Users);
    const apiKeys = identity.getPermission(Permission.ApiKeys);

    if (!groups && !users && !apiKeys) {
        return null;
    }

    return (
        <Menu name="security" label={t`Security`} icon={<SecurityIcon />}>
            <Section label={""}>
                {users && <Item label={t`Users`} path="/security/users" />}
                {groups && <Item label={t`Groups`} path="/security/groups" />}
                {apiKeys && <Item label={t`API Keys`} path="/security/api-keys" />}
            </Section>
        </Menu>
    );
};

export default [
    {
        name: "menu-security",
        type: "admin-menu",
        render(props) {
            return <SecurityMenu {...props} />;
        }
    }
];
