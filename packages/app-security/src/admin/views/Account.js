// @flow
import React, { useReducer, useEffect } from "react";
import gql from "graphql-tag";
import { pick } from "lodash";
import { get } from "dot-prop-immutable";
import { useApolloClient } from "react-apollo";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
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

const fields = `
    data {
        id email firstName lastName avatar { id src } 
    }
    error {
        code
        message
    }
`;

const GET_CURRENT_USER = gql`
    {
        security {
            getCurrentUser {
                ${fields}
            }
        }
    }
`;

const UPDATE_CURRENT_USER = gql`
    mutation updateMe($data: SecurityCurrentUserInput!) {
        security {
            updateCurrentUser(data: $data) {
                ${fields}
            }
        }
    }
`;

const UsersForm = () => {
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
            variables: { data: pick(formData, ["email", "firstName", "lastName", "avatar"]) }
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
                        <Grid>
                            <Cell span={3}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="avatar">
                                            <AvatarImage />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>
                            <Cell span={9}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="email" validators={validation.create("required")}>
                                            <Input label={t`E-mail`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="password" validators={validation.create("password")}>
                                            <Input
                                                autoComplete="off"
                                                description={
                                                    data.id && t`Type a new password to reset it.`
                                                }
                                                type="password"
                                                label={t`Password`}
                                            />
                                        </Bind>
                                    </Cell>

                                    <Cell span={12}>
                                        <Bind name="firstName">
                                            <Input label={t`First Name`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="lastName">
                                            <Input label={t`Last name`} />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>
                        </Grid>
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
