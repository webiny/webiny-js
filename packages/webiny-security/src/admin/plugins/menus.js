// @flow
import React from "react";
import { ReactComponent as SecurityIcon } from "./../assets/icons/baseline-security-24px.svg";
const securityManager = "";
import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("Cms.Categories");

export default [
    {
        name: "security-menu",
        type: "menu",
        render({ Menu }: Object) {
            return (
                <Menu label={t`Security`} icon={<SecurityIcon />}>
                    <Menu label={t`Identities`} group={securityManager}>
                        <Menu label={t`Users`} route="Users" />
                        <Menu label={t`API Tokens`} route="ApiTokens" />
                    </Menu>
                    <Menu label={t`User Management`} group={securityManager}>
                        <Menu label={t`Groups`} route="Groups" />
                        <Menu label={t`Roles`} route="Roles" />
                    </Menu>
                </Menu>
            );
        }
    }
];
