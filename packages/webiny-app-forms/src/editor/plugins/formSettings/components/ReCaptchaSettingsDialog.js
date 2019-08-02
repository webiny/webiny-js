// @flow
import React from "react";
import { Mutation } from "react-apollo";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import get from "lodash.get";
import { compose } from "recompose";
import { withSnackbar } from "webiny-admin/components";
import { CircularProgress } from "webiny-ui/Progress";
import { Grid, Cell } from "webiny-ui/Grid";
import { UPDATE_FORMS_SETTINGS } from "./graphql";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("Forms.ReCaptchaSettingsDialog");

import {
    Dialog,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter
} from "webiny-ui/Dialog";
import { ButtonDefault } from "webiny-ui/Button";

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    showSnackbar: Function,
    reCaptchaSettings: Object
};

const ReCaptchaSettingsDialog = ({
    open,
    onClose,
    showSnackbar,
    reCaptchaSettings,
    onSubmit
}: Props) => {
    // $FlowFixMe
    const [loading, setLoading] = React.useState(false);
    const { setData } = useFormEditor();

    return (
        <Dialog open={open} onClose={onClose}>
            <Mutation mutation={UPDATE_FORMS_SETTINGS}>
                {update => (
                    <Form
                        data={reCaptchaSettings}
                        onSubmit={async ({ siteKey, secretKey }) => {
                            setLoading(true);
                            const response = get(
                                await update({
                                    variables: {
                                        data: { reCaptcha: { enabled: true, siteKey, secretKey } }
                                    }
                                }),
                                "data.settings.forms"
                            );
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
                                    <DialogHeader>
                                        <DialogHeaderTitle>{t`Edit Google reCAPTCHA settings`}</DialogHeaderTitle>
                                    </DialogHeader>
                                    <DialogBody>
                                        <Grid>
                                            <Cell span={12}>
                                                <Bind name={"siteKey"} validators={"required"}>
                                                    <Input
                                                        label={"Site key"}
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
                                                <Bind name={"secretKey"} validators={"required"}>
                                                    <Input
                                                        label={"Secret key"}
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
                                    </DialogBody>
                                    <DialogFooter>
                                        <ButtonDefault
                                            onClick={submit}
                                        >{t`Enable Google reCAPTCHA`}</ButtonDefault>
                                    </DialogFooter>
                                </>
                            );
                        }}
                    </Form>
                )}
            </Mutation>
        </Dialog>
    );
};

export default compose(withSnackbar())(ReCaptchaSettingsDialog);
