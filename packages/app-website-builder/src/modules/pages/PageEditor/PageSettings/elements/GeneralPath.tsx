import React from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";

export const GeneralPath = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.path"} validators={[validation.create("required")]}>
                <Input label={"Path"} />
            </Bind>
        </Grid.Column>
    );
};
