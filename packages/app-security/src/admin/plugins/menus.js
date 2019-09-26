// @flow
import React from "react";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";

const t = i18n.ns("app-security/admin/menus");

export default [
    {
        name: "menu-security",
        type: "menu",
        render({ Menu, Section, Item }) {
            return (
                <SecureView
                    roles={{
                        groups: ["security-groups"],
                        roles: ["security-roles"],
                        users: ["security-users"]
                    }}
                >
                    {({ roles: identityRoles }) => {
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
