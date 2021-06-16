import React, { Fragment } from "react";
import { Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import cognitoAuthentication, {
    Options as CognitOptions
} from "@webiny/app-security-cognito-authentication";
import { PluginCollection } from "@webiny/plugins/types";
import { ViewPlugin } from "@webiny/app/plugins/ViewPlugin";
import { createCognitoPasswordValidator } from "./cognitoPasswordValidator";
import { Authentication, Props } from "./Authentication";

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

export interface Options extends CognitOptions {
    passwordPolicy?: PasswordPolicy;
    getIdentityData: Props["getIdentityData"];
}

export default (options: Options): PluginCollection => [
    // Configure Amplify and register ApolloLinkPlugin to attach Authorization header on each GraphQL request.
    cognitoAuthentication(options),

    // Add password input to admin user installation
    new ViewPlugin({
        name: "security.installation.fields",
        render({ children, Bind }) {
            return (
                <Fragment>
                    {children}
                    <Cell span={12}>
                        <Bind name="password" validators={validation.create("required")}>
                            <Input autoComplete="off" type="password" label={"Password"} />
                        </Bind>
                    </Cell>
                </Fragment>
            );
        }
    }),

    // Add password input to admin user form
    new ViewPlugin({
        name: "adminUsers.account.form.fields",
        render({ children, Bind, data }) {
            return (
                <Fragment>
                    {children}
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
                </Fragment>
            );
        }
    }),

    // Add password input to admin user account form
    new ViewPlugin({
        name: "adminUsers.user.form.fields",
        render({ children, Bind, data }) {
            const policy = Object.assign({}, defaultPasswordPolicy, options.passwordPolicy || {});

            const passwordValidators = [createCognitoPasswordValidator(policy)];

            if (!data.createdOn) {
                passwordValidators.push(validation.create("required"));
            }

            return (
                <Fragment>
                    {children}
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
                </Fragment>
            );
        }
    }),
    new ViewPlugin({
        name: "admin.installation.secureInstaller",
        render({ children }) {
            return (
                <Authentication getIdentityData={options.getIdentityData}>
                    {children}
                </Authentication>
            );
        }
    })
];
