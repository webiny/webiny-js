import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Bind } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";

export const AppClientInput = () => {
    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"settings.appClientId"} validators={validation.create("required")}>
                    <Input
                        label="Okta App Client ID"
                        description={
                            "This App Client ID will be used to perform the authentication."
                        }
                    />
                </Bind>
            </Cell>
        </Grid>
    );
};
