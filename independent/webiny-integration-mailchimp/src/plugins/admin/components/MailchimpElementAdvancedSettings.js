// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import { withCms } from "webiny-app-cms/context";
import MailchimpElement from "./MailchimpElement";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import { css } from "react-emotion";
import { getPlugins } from "webiny-plugins";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import settingsGql from "./graphql";
import { withSnackbar } from "webiny-admin/components";

const formPreview = css({
    padding: 25,
    border: "1px solid var(--mdc-theme-background)",
    overflow: "scroll"
});

const MailchimpElementAdvancedSettings = ({ Bind, submitApiKeyForm }: Object) => {
    return (
        <React.Fragment>
            <Query
                query={gql`
                    {
                        settings {
                            mailchimp {
                                apiKey
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
                {({ data, refetch: refetchMailchimpSettingsLists }) => {
                    const hasApiKey = get(data, "settings.mailchimp.apiKey");
                    return (
                        <>
                            <Grid>
                                {hasApiKey ? (
                                    <>
                                        <Cell span={12}>
                                            <Bind name={"settings.list"} validators={["required"]}>
                                                {({ value: id, onChange }) => {
                                                    const options = (
                                                        get(data, "mailchimp.listLists.data") || []
                                                    ).map(({ id, name }) => {
                                                        return { id, name };
                                                    });

                                                    const value = options.find(
                                                        item => item.id === id
                                                    );

                                                    return (
                                                        <AutoComplete
                                                            disabled={!hasApiKey}
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
                                                            disabled={!hasApiKey}
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
                                        <Cell span={12}>
                                            Before continuing, please enter a{" "}
                                            <a
                                                target={"_blank"}
                                                href="https://mailchimp.com/help/about-api-keys/"
                                            >
                                                Mailchimp API key
                                            </a>
                                        </Cell>
                                        <Cell span={12}>
                                            <Form
                                                onSubmit={async data => {
                                                    await submitApiKeyForm(data);
                                                    await refetchMailchimpSettingsLists();
                                                }}
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
                                                        <Cell span={12}>
                                                            <ButtonPrimary onClick={submit}>
                                                                Save API key
                                                            </ButtonPrimary>
                                                        </Cell>
                                                    </>
                                                )}
                                            </Form>
                                        </Cell>
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
    graphql(settingsGql.mutation, { name: "updateApiKey" }),
    withHandlers({
        submitApiKeyForm: ({ updateApiKey, showSnackbar }) => async data => {
            try {
                await updateApiKey({ variables: { data: { ...data, enabled: true } } });
                showSnackbar("API key saved successfully.");
            } catch (e) {
                showSnackbar(e.message);
            }
        }
    })
)(MailchimpElementAdvancedSettings);
