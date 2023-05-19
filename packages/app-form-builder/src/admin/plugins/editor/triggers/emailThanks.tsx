import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Alert } from "@webiny/ui/Alert";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as EmailIcon } from "@material-symbols/svg-400/outlined/send.svg";
import { FbEditorTrigger } from "~/types";

const t = i18n.namespace("FormsApp.Editor.EmailThanksTriggerSettings");

const plugin: FbEditorTrigger = {
    type: "form-editor-trigger",
    name: "form-editor-trigger-email-thanks",
    trigger: {
        id: "email-thanks",
        title: "E-mail - Thank You E-mail",
        description: "Send an e-mail notification to the user that submitted the form.",
        icon: <EmailIcon />,
        renderSettings({ Bind, submit, form }) {
            const hasEmailField = form.fields.some(field => field.name === "email");

            if (!hasEmailField) {
                return (
                    <Alert title={t`E-mail field required`} type={"danger"}>
                        {t`In order to use this trigger you need to add an e-mail field to your form.`}
                    </Alert>
                );
            }

            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"subject"}>
                            <Input label={t`Subject`} />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind name={"content"}>
                            <Input
                                rows={5}
                                label={t`E-mail content`}
                                description='You can use {fields.FIELD_NAME} placeholders to reference form submission values. For example: "Hello {fields.firstName} {fields.lastName}!".'
                            />
                        </Bind>
                    </Cell>
                    <Cell>
                        <ButtonPrimary
                            onClick={ev => {
                                submit(ev);
                            }}
                        >
                            {t`Save`}
                        </ButtonPrimary>
                    </Cell>
                </Grid>
            );
        }
    }
};
export default plugin;
