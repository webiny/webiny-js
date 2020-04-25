import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";

const t = i18n.ns("app-security/admin/menus");

// TODO: Update to  more fine grained scopes
const ROLE_SECURITY_GROUPS = ['security:group:crud']
const ROLE_SECURITY_ROLES = ['security:role:crud']
const ROLE_SECURITY_USERS = ['security:user:crud']

export default [
    {
        name: "menu-security",
        type: "menu",
        render({ Menu, Section, Item }) {
            return (
                <SecureView
                    scopes={{
                        groups: ROLE_SECURITY_GROUPS,
                        roles: ROLE_SECURITY_ROLES,
                        users: ROLE_SECURITY_USERS
                    }}
                >
                    {({ scopes: identityRoles }) => {
                        const { groups, roles, users } = identityRoles;
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

                                {(groups || roles) && (
                                    <Section label={t`Roles and Groups`}>
                                        {groups && <Item label={t`Groups`} path="/groups" />}
                                        {roles && <Item label={t`Roles`} path="/roles" />}
                                    </Section>
                                )}
                            </Menu>
                        );
                    }}
                </SecureView>
            );
        }
    }
];
