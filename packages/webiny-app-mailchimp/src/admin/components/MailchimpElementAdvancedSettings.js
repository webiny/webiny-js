// @flow
import * as React from "react";
import { graphql } from "react-apollo";
import { Query } from "react-apollo";
import { compose, withHandlers, withState } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";
import { css } from "react-emotion";
import { Grid, Cell } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import { withSnackbar } from "webiny-admin/components";
import { withCms } from "webiny-app-cms/context";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { getPlugins } from "webiny-plugins";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { CircularProgress } from "webiny-ui/Progress";
import MailchimpElement from "./MailchimpElement";
import settingsGql from "./graphql";

const formPreview = css({
    padding: 25,
    border: "1px solid var(--mdc-theme-background)",
    overflow: "scroll"
});

const saveApiKeyButtonWrapper = css({
    textAlign: "right",
    marginTop: 10
});

const enableMailchimpLink = css({
    cursor: "pointer"
});

const MailchimpElementAdvancedSettings = ({ Bind, submitApiKeyForm, loading }: Object) => {
    return (
        <React.Fragment>
            <Query
                query={gql`
                    {
                        mailchimp {
                            getSettings {
                                data {
                                    enabled
                                    apiKey
                                }
                            }
                        }
                        mailchimp {
                            listLists {
                                data {
                                    id
                                    name
                                }
                            }
                        }
                    }
                `}
            >
                {settingsLists => {
                    const { apiKey, enabled } =
                        get(settingsLists.data, "mailchimp.getSettings.data") || {};

                    return (
                        <>
                            <Grid>
                                {(loading || settingsLists.loading) && <CircularProgress />}
                                {apiKey && enabled ? (
                                    <>
                                        <Cell span={12}>
                                            <Bind name={"settings.list"} validators={["required"]}>
                                                {({ value: id, onChange }) => {
                                                    const options = (
                                                        get(
                                                            settingsLists.data,
                                                            "mailchimp.listLists.data"
                                                        ) || []
                                                    ).map(({ id, name }) => ({ id, name }));

                                                    const value = options.find(
                                                        item => item.id === id
                                                    );

                                                    return (
                                                        <AutoComplete
                                                            disabled={!apiKey}
                                                            options={options}
                                                            value={value}
                                                            onChange={onChange}
                                                            label={"Mailchimp list"}
                                                        />
                                                    );
                                                }}
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name={"settings.component"}
                                                validators={["required"]}
                                            >
                                                {({ onChange, value: name }) => {
                                                    const options = getPlugins(
                                                        "cms-element-mailchimp-component"
                                                    ).map(({ name, title }) => {
                                                        return {
                                                            name,
                                                            title
                                                        };
                                                    });

                                                    const value = options.find(
                                                        item => item.name === name
                                                    );

                                                    return (
                                                        <AutoComplete
                                                            disabled={!apiKey}
                                                            value={value}
                                                            options={options}
                                                            onChange={onChange}
                                                            textProp="title"
                                                            valueProp="name"
                                                            label="Mailchimp component"
                                                            description="Select a component that renders the signup form."
                                                        />
                                                    );
                                                }}
                                            </Bind>
                                        </Cell>
                                        <Cell span={12} className={formPreview}>
                                            <span>
                                                <Typography use={"overline"}>
                                                    Form preview
                                                </Typography>
                                            </span>
                                            <Bind name={"settings"}>
                                                {({ value }) => (
                                                    <div>
                                                        <MailchimpElement
                                                            element={{ settings: value }}
                                                        />
                                                    </div>
                                                )}
                                            </Bind>
                                        </Cell>
                                    </>
                                ) : (
                                    <>
                                        {!apiKey ? (
                                            <>
                                                <Cell span={12}>
                                                    Before continuing, please enter a{" "}
                                                    <a
                                                        target={"_blank"}
                                                        href="https://mailchimp.com/help/about-api-keys/"
                                                    >
                                                        Mailchimp API key
                                                    </a>
                                                    .
                                                </Cell>
                                                <Cell span={12}>
                                                    <Form
                                                        onSubmit={data =>
                                                            submitApiKeyForm({
                                                                data,
                                                                settingsLists
                                                            })
                                                        }
                                                    >
                                                        {({ Bind, submit }) => (
                                                            <>
                                                                <Cell span={12}>
                                                                    <Bind
                                                                        validators={["required"]}
                                                                        name={"apiKey"}
                                                                    >
                                                                        <Input label="API key" />
                                                                    </Bind>
                                                                </Cell>
                                                                <Cell
                                                                    span={12}
                                                                    className={
                                                                        saveApiKeyButtonWrapper
                                                                    }
                                                                >
                                                                    <ButtonPrimary onClick={submit}>
                                                                        Save API key
                                                                    </ButtonPrimary>
                                                                </Cell>
                                                            </>
                                                        )}
                                                    </Form>
                                                </Cell>
                                            </>
                                        ) : (
                                            <>
                                                <Cell span={12}>
                                                    Before continuing, please{" "}
                                                    <a
                                                        className={enableMailchimpLink}
                                                        onClick={() =>
                                                            submitApiKeyForm({
                                                                settingsLists
                                                            })
                                                        }
                                                    >
                                                        enable
                                                    </a>{" "}
                                                    the Mailchimp integration.
                                                </Cell>
                                            </>
                                        )}
                                    </>
                                )}
                            </Grid>
                        </>
                    );
                }}
            </Query>
        </React.Fragment>
    );
};

export default compose(
    withCms(),
    withSnackbar(),
    withState("loading", "setLoading", false),
    graphql(settingsGql.mutation, { name: "updateApiKey" }),
    withHandlers({
        submitApiKeyForm: ({ updateApiKey, showSnackbar, setLoading }) => async ({
            data = {},
            settingsLists
        }) => {
            setLoading(true);
            const response = await updateApiKey({
                variables: { data: { ...data, enabled: true } }
            });
            setLoading(false);
            const error = get(response, "data.mailchimp.updateSettings.error");
            if (error) {
                showSnackbar(error.message);
            } else {
                showSnackbar("Settings updated successfully.");
                settingsLists.refetch();
            }
        }
    })
)(MailchimpElementAdvancedSettings);
