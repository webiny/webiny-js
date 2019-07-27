import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";

export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-max-length",
    validator: {
        name: "maxLength",
        label: "Max length",
        description: "Entered value must not be longer than the provided max length.",
        defaultMessage: "Value is too long.",
        renderSettings({ Bind }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"settings.value"} validators={["required", "numeric"]}>
                            <Input
                                type={"number"}
                                label={"Value"}
                                description={"This is the maximum allowed length."}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
