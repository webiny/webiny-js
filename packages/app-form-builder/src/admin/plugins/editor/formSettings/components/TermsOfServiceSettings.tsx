import * as React from "react";
import { useMemo } from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import get from "lodash/get";
import { FormSettingsPluginRenderFunctionType } from "~/types";
import { createPropsFromConfig, RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { plugins } from "@webiny/plugins";

const TermsOfServiceSettings: FormSettingsPluginRenderFunctionType = ({ Bind, formData }) => {
    const enabled = get(formData, "termsOfServiceMessage.enabled");

    const rteProps = useMemo(() => {
        return createPropsFromConfig(plugins.byType("fb-rte-config").map(pl => pl.config));
    }, []);

    return (
        <>
            <Grid>
                <Cell span={12}>
                    <Bind name={"termsOfServiceMessage.enabled"}>
                        <Switch
                            label={"Enabled"}
                            description={`Will require users to "accept the terms of service" by clicking on the checkbox.`}
                        />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"termsOfServiceMessage.message"}>
                        <RichTextEditor
                            {...rteProps}
                            label={"Terms of service message"}
                            description={
                                "Show this message near the submit button or event ask users to accept before submitting."
                            }
                        />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"termsOfServiceMessage.errorMessage"}>
                        <Input
                            disabled={!enabled}
                            label={"Error message"}
                            description={
                                "Show this message once user submits the form without accepting the terms."
                            }
                        />
                    </Bind>
                </Cell>
            </Grid>
        </>
    );
};

export default TermsOfServiceSettings;
