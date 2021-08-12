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
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { UsersFormView } from "@webiny/app-security-admin-users/ui/views/Users/UsersFormView";
import { PasswordElement } from "@webiny/app-admin/ui/elements/form/PasswordElement";

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

export default (options: Options): PluginCollection => {
    const policy = Object.assign({}, defaultPasswordPolicy, options.passwordPolicy || {});
    const passwordValidators = [createCognitoPasswordValidator(policy)];

    return [
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
                            <Bind
                                name="password"
                                validators={[...passwordValidators, validation.create("required")]}
                            >
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

        // Add password input to admin user form
        new UIViewPlugin<UsersFormView>(UsersFormView, view => {
            const bioSection = view.getElement("bio");
            bioSection.addElement(
                new PasswordElement("password", {
                    name: "password",
                    label: "Password",
                    description: props => {
                        const { data } = props.formProps;
                        return data.createdOn && "Type a new password to reset it.";
                    },
                    validators: props => {
                        if (!props.formProps.data.createdOn) {
                            return [...passwordValidators, validation.create("required")];
                        }
                        return passwordValidators;
                    }
                })
            );
        }),

        // Add password input to admin user account form
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
};
