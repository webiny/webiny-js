// @flow
import React from "react";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";
import { i18n } from "webiny-app/i18n";
import { hasScopes } from "webiny-security/components";

import {
    SCOPES_API_TOKENS,
    SCOPES_GROUPS,
    SCOPES_ROLES,
    SCOPES_USERS
} from "webiny-security/admin";

const t = i18n.namespace("Cms.Categories");

export default [
    {
        name: "security-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { apiTokens, groups, roles, users }: Object = (hasScopes({
                apiTokens: SCOPES_API_TOKENS,
                groups: SCOPES_GROUPS,
                roles: SCOPES_ROLES,
                users: SCOPES_USERS
            }): any);

            const identities = apiTokens || users;
            const rolesGroups = groups || roles;

            if (identities || rolesGroups) {
                return (
                    <Menu label={t`Security`} icon={<SecurityIcon />}>
                        {identities && (
                            <Menu label={t`Identities`}>
                                {users && <Menu label={t`Users`} route="Users" />}
                                {apiTokens && <Menu label={t`API Tokens`} route="ApiTokens" />}
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
