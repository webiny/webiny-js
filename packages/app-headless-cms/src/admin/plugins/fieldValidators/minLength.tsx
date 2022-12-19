import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "~/types";
import { Bind } from "@webiny/form";

const plugin: CmsEditorFieldValidatorPlugin = {
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-min-length",
    validator: {
        name: "minLength",
        label: "Min length",
        description: "Entered value must not be shorter than the provided min length.",
        defaultMessage: "Value is too short.",
        renderSettings() {
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
                                description={"This is the minimum allowed length."}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
export default plugin;
