import React from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { useSnackbar, CenteredView } from "@webiny/app-admin";
import { CircularProgress } from "@webiny/ui/Progress";
import graphql, {
    GetFormSettingsQueryResponse,
    UpdateFormSettingsMutationResponse,
    UpdateFormSettingsMutationVariables
} from "./graphql";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { FbSettings } from "~/types";

const FormsSettings = () => {
    const { showSnackbar } = useSnackbar();

    const getSettingsQuery = useQuery<GetFormSettingsQueryResponse>(graphql.query);

    const settings = getSettingsQuery?.data?.formBuilder?.getSettings?.data || {};
    const queryInProgress = getSettingsQuery?.loading;

    const [updateSettings, updateSettingsMutation] = useMutation<
        UpdateFormSettingsMutationResponse,
        UpdateFormSettingsMutationVariables
    >(graphql.mutation, { refetchQueries: [{ query: graphql.query }] });
    const mutationInProgress = updateSettingsMutation?.loading;

    return (
        <CenteredView>
            <Form
                data={settings}
                onSubmit={data => {
                    updateSettings({
                        variables: {
                            /**
                             * We know that data is FbSettings.
                             */
                            data: data as unknown as FbSettings
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
                                <ButtonPrimary
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                >
                                    Save
                                </ButtonPrimary>
                            </SimpleFormFooter>
                        </SimpleForm>
                    );
                }}
            </Form>
        </CenteredView>
    );
};

export default FormsSettings;
