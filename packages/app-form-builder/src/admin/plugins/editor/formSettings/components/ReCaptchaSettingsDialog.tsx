import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { Grid, Cell } from "@webiny/ui/Grid";
import { UPDATE_FORMS_SETTINGS } from "./graphql";
import { useFormEditor } from "~/admin/components/FormEditor";
import { validation } from "@webiny/validation";
import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("Forms.ReCaptchaSettingsDialog");

import { Dialog, DialogTitle, DialogContent, DialogActions } from "@webiny/ui/Dialog";
import { ButtonDefault } from "@webiny/ui/Button";

interface ReCapchaSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    reCaptchaSettings: any;
}

const ReCaptchaSettingsDialog = ({
    open,
    onClose,
    reCaptchaSettings,
    onSubmit
}: ReCapchaSettingsDialogProps) => {
    const [loading, setLoading] = React.useState(false);
    const { setData } = useFormEditor();
    const { showSnackbar } = useSnackbar();

    const [updateFormsSettings] = useMutation(UPDATE_FORMS_SETTINGS);

    return (
        <Dialog open={open} onClose={onClose}>
            <Form
                data={reCaptchaSettings}
                onSubmit={async ({ siteKey, secretKey }) => {
                    setLoading(true);
                    const updateSettingsResponse = await updateFormsSettings({
                        variables: {
                            data: { reCaptcha: { enabled: true, siteKey, secretKey } }
                        }
                    });
                    const response = updateSettingsResponse?.data?.formBuilder?.updateSettings;

                    setData(data => {
                        data.settings.reCaptcha.settings = {
                            enabled: true,
                            siteKey,
                            secretKey
                        };
                        return data;
                    });
                    setLoading(false);

                    if (response.error) {
                        return showSnackbar(response.error.message);
                    }

                    onSubmit();
                }}
            >
                {({ Bind, submit }) => {
                    return (
                        <>
                            {loading && <CircularProgress />}
                            <DialogTitle>{t`Edit Google reCAPTCHA settings`}</DialogTitle>
                            <DialogContent>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind
                                            name={"siteKey"}
                                            validators={validation.create("required")}
                                        >
                                            <Input
                                                label={"Site key"}
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
                                        <Bind
                                            name={"secretKey"}
                                            validators={validation.create("required")}
                                        >
                                            <Input
                                                label={"Secret key"}
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
                            </DialogContent>
                            <DialogActions>
                                <ButtonDefault
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                >{t`Enable Google reCAPTCHA`}</ButtonDefault>
                            </DialogActions>
                        </>
                    );
                }}
            </Form>
        </Dialog>
    );
};

export default ReCaptchaSettingsDialog;
