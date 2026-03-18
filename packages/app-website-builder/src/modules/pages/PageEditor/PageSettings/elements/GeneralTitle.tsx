import React from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";

export const GeneralTitle = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.title"} validators={[validation.create("required")]}>
                <Input label={"Page title"} />
            </Bind>
        </Grid.Column>
    );
};
