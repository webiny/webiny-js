import React, { useReducer, useEffect } from "react";
import { omit } from "lodash";
import { get } from "dot-prop-immutable";
import { useApolloClient } from "@apollo/client";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Form } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { SnackbarAction } from "@webiny/ui/Snackbar";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { validation } from "@webiny/validation";
import AccountTokens from "./AccountTokens";
import AvatarImage from "../Components/AvatarImage";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings-24px.svg";
import { ReactComponent as SecurityIcon } from "../../assets/icons/security-24px.svg";
import { GET_CURRENT_USER, UPDATE_CURRENT_USER } from "./graphql";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { UserManagementUserAccountFormPlugin } from "@webiny/app-security-user-management/types";

const t = i18n.ns("app-security-user-management/account-form");

const UserAccountForm = () => {
    const uiPlugins = plugins.byType<UserManagementUserAccountFormPlugin>(
        "user-management-user-account-form"
    );

    const [{ loading, user }, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        loading: true,
        user: { data: {} }
    });
    const setIsLoading = loading => setState({ loading });

    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

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

        // TODO: update security context with new data

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
                                    <Accordion elevation={0}>
                                        <AccordionItem
                                            description="Show Account bio information"
                                            title="Bio"
                                            icon={<SettingsIcon />}
                                        >
                                            <Grid>
                                                <Cell span={12}>
                                                    <Bind
                                                        name="firstName"
                                                        validators={validation.create("required")}
                                                    >
                                                        <Input label={t`First Name`} />
                                                    </Bind>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Bind
                                                        name="lastName"
                                                        validators={validation.create("required")}
                                                    >
                                                        <Input label={t`Last Name`} />
                                                    </Bind>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Bind
                                                        name="email"
                                                        validators={validation.create("required")}
                                                    >
                                                        <Input label={t`E-mail`} />
                                                    </Bind>
                                                </Cell>
                                                {uiPlugins.map(pl => (
                                                    <React.Fragment key={pl.name}>
                                                        {pl.render({ Bind, data })}
                                                    </React.Fragment>
                                                ))}
                                            </Grid>
                                        </AccordionItem>
                                        <AccordionItem
                                            description="Show Personal Access Tokens"
                                            title="Personal Access Tokens"
                                            icon={<SecurityIcon />}
                                        >
                                            <Bind name="personalAccessTokens">
                                                <AccountTokens
                                                    data={data}
                                                    setValue={setValue}
                                                    setFormIsLoading={setIsLoading}
                                                />
                                            </Bind>
                                        </AccordionItem>
                                    </Accordion>
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
