import React, { useState, useReducer, useEffect } from "react";
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
import { CollapsibleList, SimpleListItem, ListItemMeta } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

import { SecurityViewUserAccountFormPlugin } from "@webiny/app-security/types";

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
                        token
                        createdOn
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

const GET_NEW_PAT = gql`
    mutation {
        security {
            createPAT
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

    const [tokensListIsOpen, setTokensListIsOpen] = useState(false);
    const [{ loading, user }, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        loading: true,
        user: { data: {} }
    });

    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const security = useSecurity();

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
                action: "Close"
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

    const deleteToken = removedValue => {
        const tokenIndex = user.data.personalAccessTokens.findIndex(
            PAT => PAT.token === removedValue
        );
        if (tokenIndex === -1) return;

        user.data.personalAccessTokens.splice(tokenIndex, 1);
        setState({ loading, user });
    };

    const generateToken = async () => {
        setState({ loading: true });
        const r = await client.mutate({
            mutation: GET_NEW_PAT
        });
        setState({ loading: false });
        const token = r.data.security.createPAT;

        user.data.personalAccessTokens.push({ token });
        setState({ loading, user });
    };

    const TokenListItem = ({ token }) => (
        <SimpleListItem key={token} text={token}>
            <ListItemMeta>
                <IconButton onClick={() => navigator.clipboard.writeText(token)} icon="C" />
                <IconButton onClick={() => deleteToken(token)} icon="X" />
            </ListItemMeta>
        </SimpleListItem>
    );

    const TokenList = () => {
        const personalAccessTokens = user.data.personalAccessTokens;
        if (personalAccessTokens && personalAccessTokens.length > 0)
            return personalAccessTokens.map(PAT => TokenListItem(PAT));
        else return <div style={{ paddingBottom: "16px" }}>No tokens have been generated yet.</div>;
    };

    const TokensElement = () => {
        return (
            <>
                <CollapsibleList
                    open={tokensListIsOpen}
                    handle={
                        <SimpleListItem
                            onClick={() => setTokensListIsOpen(!tokensListIsOpen)}
                            text={`Tokens`}
                        />
                    }
                >
                    <TokenList />
                </CollapsibleList>
                <ButtonPrimary onClick={() => generateToken()}>Generate</ButtonPrimary>
            </>
        );
    };

    return (
        <Form data={user.data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
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
                                avatar: (
                                    <Bind name="avatar">
                                        <AvatarImage />
                                    </Bind>
                                ),
                                email: (
                                    <Bind name="email" validators={validation.create("required")}>
                                        <Input label={t`E-mail`} />
                                    </Bind>
                                ),
                                personalAccessTokens: <TokensElement />
                            }
                        })}
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>{t`Update account`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default UserAccountForm;
