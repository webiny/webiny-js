import React from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
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

    const getSettingsQuery = useQuery(graphql.query);

    const settings = getSettingsQuery?.data?.formBuilder?.getSettings?.data || {};
    const queryInProgress = getSettingsQuery?.loading;

    const [updateSettings, updateSettingsMutation] = useMutation(graphql.mutation);
    const mutationInProgress = updateSettingsMutation?.loading;

    return (
        <Grid>
            <Cell span={3} />
            <Cell span={6}>
                <Form
                    data={settings}
                    onSubmit={async data => {
                        await updateSettings({
                            variables: {
                                data
                            }
                        });

                        showSnackbar("Settings updated successfully.");
                    }}
                >
                    {({ Bind, form, data: formData }) => {
                        const reCaptchaEnabled = formData?.reCaptcha?.enabled;

                        return (
                            <SimpleForm>
                                {(queryInProgress || mutationInProgress) && <CircularProgress />}
                                <SimpleFormHeader title="reCAPTCHA Settings" />
                                <SimpleFormContent>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"domain"}>
                                                <Input
                                                    label="Domain"
                                                    description={"E.g. https://www.mywebsite.com"}
                                                />
                                            </Bind>
                                        </Cell>

                                        <Cell span={12}>
                                            <Bind name={"reCaptcha.enabled"}>
                                                <Switch label={"Enable Google reCAPTCHA"} />
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
                                                                rel="noopener noreferrer"
                                                            >
                                                                Don&apos;t have a site key?
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
                                                    label={"Google reCAPTCHA secret key"}
                                                    description={
                                                        <>
                                                            A v2 Tickbox secret key.{" "}
                                                            <a
                                                                href="https://www.google.com/recaptcha/admin"
                                                                target={"_blank"}
                                                                rel="noopener noreferrer"
                                                            >
                                                                Don&apos;t have a site key?
                                                            </a>
                                                        </>
                                                    }
                                                />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </SimpleFormContent>
                                <SimpleFormFooter>
                                    <ButtonPrimary onClick={form.submit}>Save</ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        );
                    }}
                </Form>
            </Cell>
            <Cell span={3} />
        </Grid>
    );
};

export default FormsSettings;
