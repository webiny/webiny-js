import * as React from "react";
import { get } from "lodash";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Query, Mutation } from "@apollo/client/react/components";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import graphql from "./graphql";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-mailchimp/admin");

const MailchimpSettings = () => {
    const { showSnackbar } = useSnackbar();

    return (
        <Query query={graphql.query}>
            {({ data, loading: queryInProgress }) => {
                const settings = get(data, "mailchimp.getSettings.data") || {};
                return (
                    <Mutation mutation={graphql.mutation}>
                        {(update, { loading: mutationInProgress }) => (
                            <Form
                                data={settings}
                                onSubmit={async data => {
                                    const response = await update({
                                        variables: {
                                            data
                                        }
                                    });

                                    const error = get(
                                        response,
                                        "data.mailchimp.updateSettings.error.message"
                                    );

                                    if (error) {
                                        return showSnackbar(error);
                                    }
                                    showSnackbar(t`Settings updated successfully.`);
                                }}
                            >
                                {({ Bind, form, data }) => (
                                    <SimpleForm>
                                        {(queryInProgress || mutationInProgress) && (
                                            <CircularProgress />
                                        )}
                                        <SimpleFormHeader title={t`Mailchimp Settings`}>
                                            <Bind
                                                name={"enabled"}
                                                afterChange={enabled => {
                                                    if (!enabled) {
                                                        form.submit();
                                                    }
                                                }}
                                            >
                                                <Switch label={t`Enabled`} />
                                            </Bind>
                                        </SimpleFormHeader>
                                        {data.enabled ? (
                                            <>
                                                <SimpleFormContent>
                                                    <Grid>
                                                        <Cell span={12}>
                                                            <Grid>
                                                                <Cell span={6}>
                                                                    <Bind name={"apiKey"}>
                                                                        <Input
                                                                            label={t`API key`}
                                                                            description={
                                                                                <>
                                                                                    {t`Click`}{" "}
                                                                                    <a
                                                                                        /* eslint-disable-next-line react/jsx-no-target-blank */
                                                                                        target={
                                                                                            "_blank"
                                                                                        }
                                                                                        href="https://mailchimp.com/help/about-api-keys/"
                                                                                    >
                                                                                        {t`here`}
                                                                                    </a>{" "}
                                                                                    {t`for more information about Mailchimp API keys.`}
                                                                                </>
                                                                            }
                                                                        />
                                                                    </Bind>
                                                                </Cell>
                                                            </Grid>
                                                        </Cell>
                                                    </Grid>
                                                </SimpleFormContent>
                                                <SimpleFormFooter>
                                                    <ButtonPrimary onClick={form.submit}>
                                                        {t`Save`}
                                                    </ButtonPrimary>
                                                </SimpleFormFooter>
                                            </>
                                        ) : null}
                                    </SimpleForm>
                                )}
                            </Form>
                        )}
                    </Mutation>
                );
            }}
        </Query>
    );
};

export default MailchimpSettings;
