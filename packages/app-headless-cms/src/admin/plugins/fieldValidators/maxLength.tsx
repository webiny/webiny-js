import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "~/types";

export default {
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-max-length",
    validator: {
        name: "maxLength",
        label: "Max length",
        description: "Entered value must not be longer than the provided max length.",
        defaultMessage: "Value is too long.",
        renderSettings({ Bind }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind
                            name={"settings.value"}
                            validators={validation.create("required,numeric")}
                        >
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
} as CmsEditorFieldValidatorPlugin;
