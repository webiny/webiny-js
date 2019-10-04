// @flow
import React, { useReducer, useEffect } from "react";
import gql from "graphql-tag";
import { omit } from "lodash";
import { get } from "dot-prop-immutable";
import { useApolloClient } from "react-apollo";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { getPlugins } from "@webiny/plugins";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import AvatarImage from "./Components/AvatarImage";
import { validation } from "@webiny/validation";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("app-security/admin/account-form");

const GET_CURRENT_USER = gql`
    {
        security {
            getCurrentUser {
                data {
                    id
                    email
                    avatar {
                        id
                        src
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const UPDATE_CURRENT_USER = gql`
    mutation updateMe($data: SecurityCurrentUserInput!) {
        security {
            updateCurrentUser(data: $data) {
                data {
                    id
                    email
                    avatar {
                        id
                        src
                    }
                }
            }
        }
    }
`;

const UsersForm = () => {
    console.log(process.env.REACT_APP_FILES_PROXY)
    const auth = getPlugins("security-authentication-provider")
        .filter(pl => pl.hasOwnProperty("renderUserAccountForm"))
        .pop();

    if (!auth) {
        throw Error(
            `You must register a "security-authentication-provider" plugin to render Account form!`
        );
    }

    const { renderUserAccountForm } = auth;

    const [{ loading, user }, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        loading: true,
        user: { data: {} }
    });

    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const onSubmit = useHandler(null, () => async formData => {
        setState({ loading: true });
        const { data: response } = await client.mutate({
            mutation: UPDATE_CURRENT_USER,
            variables: { data: omit(formData, ["id"]) }
        });
        const { error } = response.security.updateCurrentUser;
        setState({ loading: false });
        if (error) {
            return showSnackbar(error.message, {
                actionText: "Close"
            });
        }

        showSnackbar("Account saved successfully!");
    });

    useEffect(() => {
        client.query({ query: GET_CURRENT_USER }).then(({ data }) => {
            setState({ loading: false, user: get(data, "security.getCurrentUser") });
        });
    }, []);

    return (
        <Form data={user.data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={"Account"} />
                    <SimpleFormContent>
                        {renderUserAccountForm({
                            Bind,
                            data,
                            fields: {
                                firstName: (
                                    <Bind
                                        name="firstName"
                                        validators={validation.create("required")}
                                    >
                                        <Input label={t`First Name`} />
                                    </Bind>
                                ),
                                lastName: (
                                    <Bind
                                        name="lastName"
                                        validators={validation.create("required")}
                                    >
                                        <Input label={t`Last name`} />
                                    </Bind>
                                ),
                                avatar: (
                                    <Bind name="avatar">
                                        <AvatarImage />
                                    </Bind>
                                ),
                                email: (
                                    <Bind name="email" validators={validation.create("required")}>
                                        <Input label={t`E-mail`} />
                                    </Bind>
                                )
                            }
                        })}
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Update account`}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default UsersForm;
