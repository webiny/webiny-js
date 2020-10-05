import React, { useReducer, useEffect } from "react";
import gql from "graphql-tag";
import { omit } from "lodash";
import { get } from "dot-prop-immutable";
import { useApolloClient } from "react-apollo";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { getPlugin } from "@webiny/plugins";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import AvatarImage from "./Components/AvatarImage";
import { validation } from "@webiny/validation";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import AccountTokens from "./AccountTokens";
import { SnackbarAction } from "@webiny/ui/Snackbar";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

import { SecurityViewUserAccountFormPlugin } from "@webiny/app-security/types";
import { Cell, Grid } from "@webiny/ui/Grid";

const t = i18n.ns("app-security/admin/account-form");

const GET_CURRENT_USER = gql`
    {
        security {
            getCurrentUser {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar {
                        id
                        src
                    }
                    personalAccessTokens {
                        id
                        name
                        token
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

const UserAccountForm = () => {
    const auth = getPlugin<SecurityViewUserAccountFormPlugin>("security-view-user-account-form");

    if (!auth) {
        throw Error(
            `You must register a "security-view-user-account-form" plugin to render Account form!`
        );
    }

    const [{ loading, user }, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        loading: true,
        user: { data: {} }
    });
    const setIsLoading = loading => setState({ loading });

    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const security = useSecurity();

    const onSubmit = useHandler(null, () => async formData => {
        setState({ loading: true });
        const { data: response } = await client.mutate({
            mutation: UPDATE_CURRENT_USER,
            variables: { data: omit(formData, ["id", "personalAccessTokens"]) }
        });
        const { error } = response.security.updateCurrentUser;
        setState({ loading: false });
        if (error) {
            return showSnackbar(error.message, {
                action: <SnackbarAction label="Close" onClick={() => showSnackbar(null)} />
            });
        }

        security.refreshUser();
        showSnackbar("Account saved successfully!");
    });

    useEffect(() => {
        client.query({ query: GET_CURRENT_USER }).then(({ data }) => {
            setState({ loading: false, user: get(data, "security.getCurrentUser") });
        });
    }, []);

    return (
        <Grid>
            <Cell span={3} />
            <Cell span={6}>
                <Form data={user.data} onSubmit={onSubmit}>
                    {({ data, form, Bind, setValue }) => (
                        <>
                            <div style={{ marginBottom: "32px" }}>
                                <Bind name="avatar">
                                    <AvatarImage round />
                                </Bind>
                            </div>
                            <SimpleForm>
                                {loading && <CircularProgress style={{ zIndex: 3 }} />}
                                <SimpleFormHeader title={"Account"} />
                                <SimpleFormContent>
                                    {React.createElement(auth.view, {
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
                                                    <Input label={t`Last Name`} />
                                                </Bind>
                                            ),
                                            email: (
                                                <Bind
                                                    name="email"
                                                    validators={validation.create("required")}
                                                >
                                                    <Input label={t`E-mail`} />
                                                </Bind>
                                            ),
                                            personalAccessTokens: (
                                                <Bind name="personalAccessTokens">
                                                    <AccountTokens
                                                        data={data}
                                                        setValue={setValue}
                                                        setFormIsLoading={setIsLoading}
                                                    />
                                                </Bind>
                                            )
                                        }
                                    })}
                                </SimpleFormContent>
                                <SimpleFormFooter>
                                    <ButtonPrimary
                                        onClick={form.submit}
                                    >{t`Update account`}</ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        </>
                    )}
                </Form>
            </Cell>
        </Grid>
    );
};

export default UserAccountForm;
