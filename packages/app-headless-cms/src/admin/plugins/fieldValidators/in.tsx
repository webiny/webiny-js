import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Tags } from "@webiny/ui/Tags";
import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";
import { Bind } from "@webiny/form";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-in",
    validator: {
        name: "in",
        label: "Specific values",
        description:
            "You won't be able to submit the form if the field value is not in the list of specified values",
        defaultMessage: "Value is not allowed.",
        renderSettings() {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"settings.values"} validators={validation.create("required")}>
                            <Tags
                                label={"Allowed values"}
                                description={"Hit ENTER to add values"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        },
        validate: async (value, { validator }) => {
            const values = validator.settings.values;
            if (Array.isArray(values) === false || values.length === 0) {
                return true;
            }
            return validation.validate(value, `in:${values.join(":")}`);
        }
    }
};
export default plugin;
