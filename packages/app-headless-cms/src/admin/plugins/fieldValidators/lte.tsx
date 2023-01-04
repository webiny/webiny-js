import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "~/types";
import { Bind } from "@webiny/form";

const plugin: CmsEditorFieldValidatorPlugin = {
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-lte",
    validator: {
        name: "lte",
        label: "Smaller or equal",
        description: "Entered value must be equal or lower than the provided min value.",
        defaultMessage: "Value is too great.",
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
