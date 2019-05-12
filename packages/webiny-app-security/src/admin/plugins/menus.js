// @flow
import React from "react";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";
import { i18n } from "webiny-app/i18n";
import { hasRoles } from "webiny-app-security";

const t = i18n.namespace("Cms.Categories");

export default [
    {
        name: "security-menu",
        type: "menu",
        render({ Menu }: Object) {
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
                            <Menu label={t`Identities`}>
                                {users && <Menu label={t`Users`} path="/users" />}
                            </Menu>
                        )}

                        {rolesGroups && (
                            <Menu label={t`Roles and Groups`}>
                                {groups && <Menu label={t`Groups`} path="/groups" />}
                                {roles && <Menu label={t`Roles`} path="/roles" />}
                            </Menu>
                        )}
                    </Menu>
                );
            }

            return null;
        }
    }
];
