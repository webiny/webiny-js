import React from "react";
import { Grid, Textarea, Input } from "webiny/admin/ui";
import { Bind } from "webiny/admin/form";

export const TextareaFieldSettings = () => {
    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind name={"extra.placeholderText"}>
                    <Input label={"Placeholder text"} description={"Placeholder text (optional)"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"value.value"}>
                    <Textarea
                        rows={4}
                        label={"Default value"}
                        description={"Default value (optional)"}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"extra.rows"}>
                    <Input
                        type={"number"}
                        label={"Text area rows"}
                        description={"Default value (optional)"}
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};
