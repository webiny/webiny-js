import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ReactComponent as EmailIcon } from "@material-design-icons/svg/outlined/email.svg";
import { ButtonPrimary } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";
import { FbEditorTrigger } from "~/types";

const t = i18n.namespace("FormsApp.Editor.EmailTriggerSettings");

const plugin: FbEditorTrigger = {
    type: "form-editor-trigger",
    name: "form-editor-trigger-email",
    trigger: {
        id: "email",
        title: "Email",
        description: "Send data on a specific email address.",
        icon: <EmailIcon />,
        renderSettings({ Bind, submit }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"email"} validators={validation.create("email")}>
                            <Input label={t`Email address`} />
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
