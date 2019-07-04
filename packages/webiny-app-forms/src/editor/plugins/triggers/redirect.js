import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ReactComponent as LinkIcon } from "./icons/round-link-24px.svg";
import { ButtonPrimary } from "webiny-ui/Button";
import { get } from "lodash";
import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.Editor.RedirectTriggerSettings");

export default {
    type: "form-editor-trigger",
    name: "form-editor-trigger-redirect",
    trigger: {
        id: "redirect",
        title: "Redirect",
        description: "Send a user to a specific URL.",
        icon: <LinkIcon />,
        renderSettings({ Bind, submit, form }) {
            const hasSuccessMessage = get(form, "settings.successMessage.values.length") > 0;
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"url"}>
                            <Input label={t`Redirect URL`} />
                        </Bind>
                        {hasSuccessMessage && (
                            <div>
                                {t`This form has a success message set. Note that it will not be
                                visible if a redirect is set.`}
                            </div>
                        )}
                    </Cell>
                    <Cell>
                        <ButtonPrimary onClick={submit}>{t`Save`}</ButtonPrimary>
                    </Cell>
                </Grid>
            );
        }
    }
};
