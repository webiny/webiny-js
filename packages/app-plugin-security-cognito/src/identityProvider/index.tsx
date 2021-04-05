import React from "react";
import isEmpty from "lodash/isEmpty";
import { Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { i18n } from "@webiny/app/i18n";
import {
    SecurityInstallationFormPlugin,
    SecurityUserAccountFormPlugin,
    SecurityUserFormPlugin
} from "@webiny/app-security-tenancy/types";
import { PluginCollection } from "@webiny/plugins/types";
import { CognitoIdentityProviderOptions } from "../types";
import { createCognitoPasswordValidator } from "./cognitoPasswordValidator";

const t1 = i18n.ns("cognito/user-management/installation-form");
const t2 = i18n.ns("cognito/user-management/user-account-form");
const t3 = i18n.ns("cognito/user-management/user-form");

const defaultPasswordPolicy = {
    minimumLength: 8,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    requireUppercase: false
};

export default (options?: CognitoIdentityProviderOptions): PluginCollection => [
    {
        type: "security-installation-form",
        render({ Bind }) {
            return (
                <Cell span={12}>
                    <Bind name="password" validators={validation.create("required")}>
                        <Input autoComplete="off" type="password" label={t1`Password`} />
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
                            description={data.id && t2`Type a new password to reset it.`}
                            type="password"
                            label={t2`Password`}
                        />
                    </Bind>
                </Cell>
            );
        }
    } as SecurityUserAccountFormPlugin,
    {
        type: "security-user-form",
        render({ Bind, data }) {
            const cognitoPasswordPolicy = !isEmpty(options && options.passwordPolicy)
                ? options.passwordPolicy
                : defaultPasswordPolicy;

            const passwordValidators = [createCognitoPasswordValidator(cognitoPasswordPolicy)];

            if (!data.createdOn) {
                passwordValidators.push(validation.create("required"));
            }

            return (
                <Cell span={12}>
                    <Bind name="password" validators={passwordValidators}>
                        <Input
                            autoComplete="off"
                            description={data.id && t3`Type a new password to reset it.`}
                            type="password"
                            label={t3`Password`}
                        />
                    </Bind>
                </Cell>
            );
        }
    } as SecurityUserFormPlugin
];
