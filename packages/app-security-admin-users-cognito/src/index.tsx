import React from "react";
import { Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import {
    SecurityInstallationFormPlugin,
    SecurityUserAccountFormPlugin,
    SecurityUserFormPlugin
} from "@webiny/app-security-admin-users/types";
import { PluginCollection } from "@webiny/plugins/types";
import { createCognitoPasswordValidator } from "./cognitoPasswordValidator";

const defaultPasswordPolicy = {
    minimumLength: 8,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    requireUppercase: false
};

export interface PasswordPolicy {
    minimumLength?: number;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    requireUppercase?: boolean;
}

export interface Options {
    passwordPolicy?: PasswordPolicy;
}

export default (options: Options = {}): PluginCollection => [
    {
        type: "security-installation-form",
        render({ Bind }) {
            return (
                <Cell span={12}>
                    <Bind name="password" validators={validation.create("required")}>
                        <Input autoComplete="off" type="password" label={"Password"} />
                    </Bind>
                </Cell>
            );
        }
    } as SecurityInstallationFormPlugin,
    {
        type: "security-user-account-form",
        render({ Bind, data }) {
            return (
                <Cell span={12}>
                    <Bind name="password">
                        <Input
                            autoComplete="off"
                            description={data.id && "Type a new password to reset it."}
                            type="password"
                            label={"Password"}
                        />
                    </Bind>
                </Cell>
            );
        }
    } as SecurityUserAccountFormPlugin,
    {
        type: "security-user-form",
        render({ Bind, data }) {
            const policy = Object.assign({}, defaultPasswordPolicy, options.passwordPolicy || {});

            const passwordValidators = [createCognitoPasswordValidator(policy)];

            if (!data.createdOn) {
                passwordValidators.push(validation.create("required"));
            }

            return (
                <Cell span={12}>
                    <Bind name="password" validators={passwordValidators}>
                        <Input
                            autoComplete="off"
                            description={data.id && "Type a new password to reset it."}
                            type="password"
                            label={"Password"}
                        />
                    </Bind>
                </Cell>
            );
        }
    } as SecurityUserFormPlugin
];
