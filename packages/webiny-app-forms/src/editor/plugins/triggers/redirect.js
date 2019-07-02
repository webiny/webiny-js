import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ReactComponent as LinkIcon } from "./icons/round-link-24px.svg";
import { ButtonPrimary } from "webiny-ui/Button";

export default {
    type: "form-editor-trigger",
    name: "form-editor-trigger-redirect",
    trigger: {
        id: "redirect",
        title: "Redirect",
        description: "Send a user to a specific URL.",
        icon: <LinkIcon />,
        renderSettings({ Bind, submit }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"url"}>
                            <Input label={"Redirect URL"} />
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
