import React, { useState, useCallback } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { useQuery } from "@apollo/react-hooks";
import { GET_RECAPTCHA_SETTINGS, GetReCaptchaSettingsQueryResponse } from "./graphql";
import ReCaptchaSettingsDialog from "./ReCaptchaSettingsDialog";
import { Alert } from "@webiny/ui/Alert";
import { Input } from "@webiny/ui/Input";
import { BindComponent } from "@webiny/form";
import { FbSettings } from "~/types";

interface ReCaptchaSettingsProps {
    Bind: BindComponent;
    formData: FbSettings;
}
const ReCaptchaSettings = ({ Bind, formData }: ReCaptchaSettingsProps) => {
    const [dialogOpened, setDialogOpened] = useState(false);
    const openDialog = useCallback(() => setDialogOpened(true), []);
    const closeDialog = useCallback(() => setDialogOpened(false), []);

    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const { data, refetch } = useQuery<GetReCaptchaSettingsQueryResponse>(GET_RECAPTCHA_SETTINGS, {
        onCompleted: () => setSettingsLoaded(true)
    });

    const settings: Partial<FbSettings["reCaptcha"]> =
        data?.formBuilder?.getSettings?.data?.reCaptcha || {};
    const reCaptchaEnabledInSettings = settings.enabled && settings.siteKey && settings.secretKey;
    const reCaptchaEnabled = formData?.reCaptcha?.enabled;

    return (
        <Bind name={"reCaptcha.enabled"}>
            {({ onChange, ...rest }) => (
                <Grid>
                    <Cell span={12}>
                        <Switch
                            onChange={value => {
                                if (value && !reCaptchaEnabledInSettings) {
                                    openDialog();
                                    return;
                                }

                                onChange(value);
                            }}
                            {...rest}
                            label={"Enabled"}
                            description={`Will require users to "confirm they are human" by clicking on a special checkbox.`}
                        />
                    </Cell>
                    <Cell span={12}>
                        <Bind name={"reCaptcha.errorMessage"}>
                            <Input disabled={!reCaptchaEnabled} label={"Error message"} />
                        </Bind>
                    </Cell>

                    {settingsLoaded && !reCaptchaEnabledInSettings && (
                        <Cell span={12}>
                            <Alert type="danger" title="Google reCAPTCHA not enabled.">
                                Click{" "}
                                <a href="#" onClick={openDialog}>
                                    here
                                </a>{" "}
                                to update your Google reCAPTCHA settings.
                            </Alert>
                        </Cell>
                    )}
                    <ReCaptchaSettingsDialog
                        reCaptchaSettings={settings}
                        open={dialogOpened}
                        onClose={closeDialog}
                        onSubmit={() => {
                            refetch();
                            onChange(true);
                            closeDialog();
                        }}
                    />
                </Grid>
            )}
        </Bind>
    );
};

export default ReCaptchaSettings;
