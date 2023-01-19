import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";
import { ReactComponent as EmailIcon } from "@material-symbols/svg-400/outlined/mark_email_unread.svg";
import { FbEditorTrigger } from "~/types";

const t = i18n.namespace("FormsApp.Editor.EmailNotificationTriggerSettings");

const plugin: FbEditorTrigger = {
    type: "form-editor-trigger",
    name: "form-editor-trigger-email-notification",
    trigger: {
        id: "email-notification",
        title: "Email - Submission Notification",
        description: "Send an email notification with form submission details.",
        icon: <EmailIcon />,
        renderSettings({ Bind, submit }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"email"} validators={validation.create("email")}>
                            <Input
                                label={t`Email address`}
                                description={t`Email address to which the submission details will be sent to.`}
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
