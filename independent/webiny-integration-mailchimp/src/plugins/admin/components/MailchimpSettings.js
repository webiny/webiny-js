// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Switch } from "webiny-ui/Switch";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { Query, Mutation } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";
import graphql from "./graphql";
import { CircularProgress } from "webiny-ui/Progress";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-admin/components/SimpleForm";

const MailchimpSettings = ({ showSnackbar }) => {
    return (
        <Query query={graphql.query}>
            {({ data, loading: queryInProgress }) => (
                <Mutation mutation={graphql.mutation}>
                    {(update, { loading: mutationInProgress }) => (
                        <Form
                            data={data.settings}
                            onSubmit={async data => {
                                await update({
                                    variables: {
                                        data: data.mailchimp
                                    }
                                });
                                showSnackbar("Settings updated successfully.");
                            }}
                        >
                            {({ Bind, form, data }) => (
                                <SimpleForm>
                                    {(queryInProgress || mutationInProgress) && (
                                        <CircularProgress />
                                    )}
                                    <SimpleFormHeader title="Mailchimp Settings">
                                        <Bind
                                            name={"mailchimp.enabled"}
                                            afterChange={enabled => {
                                                if (!enabled) {
                                                    form.submit();
                                                }
                                            }}
                                        >
                                            <Switch label="Enabled" />
                                        </Bind>
                                    </SimpleFormHeader>
                                    {data.mailchimp && data.mailchimp.enabled ? (
                                        <>
                                            <SimpleFormContent>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Grid>
                                                            <Cell span={6}>
                                                                <Bind
                                                                    name={"mailchimp.apiKey"}
                                                                    validators={["required"]}
                                                                >
                                                                    <Input label="API key" />
                                                                </Bind>
                                                            </Cell>
                                                        </Grid>
                                                    </Cell>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <ButtonPrimary
                                                    type="primary"
                                                    onClick={form.submit}
                                                    align="right"
                                                >
                                                    Save
                                                </ButtonPrimary>
                                            </SimpleFormFooter>
                                        </>
                                    ) : null}
                                </SimpleForm>
                            )}
                        </Form>
                    )}
                </Mutation>
            )}
        </Query>
    );
};

export default withSnackbar()(MailchimpSettings);
