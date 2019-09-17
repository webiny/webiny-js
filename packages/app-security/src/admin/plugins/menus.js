// @flow
import React from "react";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { hasRoles } from "@webiny/app-security";

const t = i18n.ns("app-security/admin/menus");

export default [
    {
        name: "security-menu",
        type: "menu",
        render({ Menu, Section, Item }) {
            const { groups, roles, users }: Object = (hasRoles({
                groups: ["security-groups"],
                roles: ["security-roles"],
                users: ["security-users"]
            }): any);

            const identities = users;
            const rolesGroups = groups || roles;

            if (identities || rolesGroups) {
                return (
                    <Menu label={t`Security`} icon={<SecurityIcon />}>
                        {identities && (
                            <Section label={t`Identities`}>
                                {users && <Item label={t`Users`} path="/users" />}
                            </Section>
                        )}

                        {rolesGroups && (
                            <Section label={t`Roles and Groups`}>
                                {groups && <Item label={t`Groups`} path="/groups" />}
                                {roles && <Item label={t`Roles`} path="/roles" />}
                            </Section>
                        )}
                    </Menu>
                );
            }

            return null;
        }
    }
];
