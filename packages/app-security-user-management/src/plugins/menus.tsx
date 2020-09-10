import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";

const t = i18n.ns("app-security/admin/menus");

// TODO: Update to  more fine grained scopes
const ROLE_SECURITY_GROUPS = "security.group.crud";
const ROLE_SECURITY_ROLES = "security.role.crud";
const ROLE_SECURITY_USERS = "security.user.crud";

const SecurityMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    const groups = identity.getPermission(ROLE_SECURITY_GROUPS);
    const roles = identity.getPermission(ROLE_SECURITY_ROLES);
    const users = identity.getPermission(ROLE_SECURITY_USERS);

    if (!groups && !roles && !users) {
        return null;
    }

    return (
        <Menu name="security" label={t`Security`} icon={<SecurityIcon />}>
            {users && (
                <Section label={t`Identities`}>
                    {users && <Item label={t`Users`} path="/users" />}
                </Section>
            )}

            {groups && (
                <Section label={t`Groups`}>
                    {groups && <Item label={t`Groups`} path="/groups" />}
                </Section>
            )}
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
