import React from "react";
import { Grid, Textarea } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const GeneralSnippet = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.snippet"}>
                <Textarea label={"Snippet"} />
            </Bind>
        </Grid.Column>
    );
};
