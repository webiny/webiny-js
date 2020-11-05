import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";

const t = i18n.ns("app-security/admin/menus");

const PERMISSION_SECURITY_GROUPS = "security.group.manage";
const PERMISSION_SECURITY_USERS = "security.user.manage";

const SecurityMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    const groups = identity.getPermission(PERMISSION_SECURITY_GROUPS);
    const users = identity.getPermission(PERMISSION_SECURITY_USERS);

    if (!groups && !users) {
        return null;
    }

    return (
        <Menu name="security" label={t`Security`} icon={<SecurityIcon />}>
            {users && (
                <Section label={t`Identities`}>
                    {users && <Item label={t`Users`} path="/security/users" />}
                </Section>
            )}

            {groups && (
                <Section label={t`Groups`}>
                    {groups && <Item label={t`Groups`} path="/security/groups" />}
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
