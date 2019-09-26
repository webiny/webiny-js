import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as LinkIcon } from "./icons/round-link-24px.svg";
import WebhooksRequestsDynamicFieldset from "./components/WebhooksRequestsDynamicFieldset";
import { ButtonPrimary } from "@webiny/ui/Button";

export default {
    type: "form-editor-trigger",
    name: "form-editor-trigger-webhook",
    trigger: {
        id: "webhook",
        title: "Webhook",
        description: "Do a POST HTTP request to a specific URL.",
        icon: <LinkIcon />,
        renderSettings({ Bind, submit }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"urls"}>
                            <WebhooksRequestsDynamicFieldset
                                Bind={Bind}
                                title={"Webhook URLs"}
                                inputLabel={"URL"}
                                addButtonLabel={"+ Add URL"}
                            />
                        </Bind>
                    </Cell>
                    <Cell>
                        <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                    </Cell>
                </Grid>
            );
        }
    }
};
