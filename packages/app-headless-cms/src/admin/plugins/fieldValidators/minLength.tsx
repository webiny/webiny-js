import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { Bind } from "@webiny/form";
import { CmsModelFieldValidatorPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-min-length",
    validator: {
        name: "minLength",
        label: "Min length",
        description: "Entered value must not be shorter than the provided min length.",
        defaultMessage: "Value is too short.",
        variables: [{ name: "value", description: "This is the minimum allowed length." }],
        getVariableValues: ({ validator }) => {
            return { value: validator.settings.value };
        },
        renderSettings(config) {
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
                                description={config.getVariableDescription("value")}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        },
        validate: async (value, { validator }) => {
            const minLengthValue = validator.settings.value;
            if (typeof minLengthValue === "undefined") {
                return true;
            }
            return validation.validate(value, `minLength:${minLengthValue}`);
        }
    }
};
export default plugin;
