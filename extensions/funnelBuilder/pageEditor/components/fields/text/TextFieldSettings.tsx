import React from "react";
import { Grid, Input } from "webiny/admin/ui";
import { Bind } from "webiny/admin/form";

export const TextFieldSettings = () => {
    return (
        <Grid gap={"compact"}>
            <Grid.Column span={12}>
                <Bind name={"extra.placeholderText"}>
                    <Input label={"Placeholder text"} description={"Placeholder text (optional)"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"value.value"}>
                    <Input label={"Default value"} description={"Default value (optional)"} />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};
