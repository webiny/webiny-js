import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "~/types";
import { Bind } from "@webiny/form";

const plugin: CmsEditorFieldValidatorPlugin = {
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-gte",
    validator: {
        name: "gte",
        label: "Greater or equal",
        description: "Entered value must be equal or greater than the provided max value.",
        defaultMessage: "Value is too small.",
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
                                description={"This is the greatest value that will be allowed"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
export default plugin;
