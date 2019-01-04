// @flow
import React from "react";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";
import { i18n } from "webiny-app/i18n";
import { hasScopes } from "webiny-app-security";

import { SCOPES_GROUPS, SCOPES_ROLES, SCOPES_USERS } from "webiny-app-security/admin";

const t = i18n.namespace("Cms.Categories");

export default [
    {
        name: "security-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { groups, roles, users }: Object = (hasScopes({
                groups: SCOPES_GROUPS,
                roles: SCOPES_ROLES,
                users: SCOPES_USERS
            }): any);

            const identities = users;
            const rolesGroups = groups || roles;

            if (identities || rolesGroups) {
                return (
                    <Menu label={t`Security`} icon={<SecurityIcon />}>
                        {identities && (
                            <Menu label={t`Identities`}>
                                {users && <Menu label={t`Users`} route="Users" />}
                            </Menu>
                        )}

                        {rolesGroups && (
                            <Menu label={t`Roles and Groups`}>
                                {groups && <Menu label={t`Groups`} route="Groups" />}
                                {roles && <Menu label={t`Roles`} route="Roles" />}
                            </Menu>
                        )}
                    </Menu>
                );
            }

            return null;
        }
    }
];
