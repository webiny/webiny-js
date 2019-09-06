import React from "react";
import { get } from "lodash";
import { Query, Mutation } from "react-apollo";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { useSnackbar } from "@webiny/app-admin/components";
import { CircularProgress } from "@webiny/ui/Progress";
import graphql from "./graphql";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";

const FormsSettings = () => {
    const { showSnackbar } = useSnackbar();
    return (
        <Query query={graphql.query}>
            {({ data, loading: queryInProgress }) => {
                const settings = get(data, "forms.getSettings.data") || {};

                return (
                    <Mutation mutation={graphql.mutation}>
                        {(update, { loading: mutationInProgress }) => (
                            <Form
                                data={settings}
                                onSubmit={async data => {
                                    await update({
                                        variables: {
                                            data
                                        }
                                    });

                                    showSnackbar("Settings updated successfully.");
                                }}
                            >
                                {({ Bind, form, data: formData }) => {
                                    const reCaptchaEnabled = get(formData, "reCaptcha.enabled");

                                    return (
                                        <SimpleForm>
                                            {(queryInProgress || mutationInProgress) && (
                                                <CircularProgress />
                                            )}
                                            <SimpleFormHeader title="Forms Settings" />
                                            <SimpleFormContent>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Bind name={"reCaptcha.enabled"}>
                                                            <Switch
                                                                label={"Enable Google reCAPTCHA"}
                                                            />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind name={"reCaptcha.siteKey"}>
                                                            <Input
                                                                disabled={!reCaptchaEnabled}
                                                                label={"Google reCAPTCHA site key"}
                                                                description={
                                                                    <>
                                                                        A v2 Tickbox site key.{" "}
                                                                        <a
                                                                            href="https://www.google.com/recaptcha/admin"
                                                                            target={"_blank"}
                                                                        >
                                                                            Don't have a site key?
                                                                        </a>
                                                                    </>
                                                                }
                                                            />
                                                        </Bind>
                                                    </Cell>

                                                    <Cell span={12}>
                                                        <Bind name={"reCaptcha.secretKey"}>
                                                            <Input
                                                                disabled={!reCaptchaEnabled}
                                                                label={
                                                                    "Google reCAPTCHA secret key"
                                                                }
                                                                description={
                                                                    <>
                                                                        A v2 Tickbox secret key.{" "}
                                                                        <a
                                                                            href="https://www.google.com/recaptcha/admin"
                                                                            target={"_blank"}
                                                                        >
                                                                            Don't have a site key?
                                                                        </a>
                                                                    </>
                                                                }
                                                            />
                                                        </Bind>
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
                                        </SimpleForm>
                                    );
                                }}
                            </Form>
                        )}
                    </Mutation>
                );
            }}
        </Query>
    );
};

export default FormsSettings;
