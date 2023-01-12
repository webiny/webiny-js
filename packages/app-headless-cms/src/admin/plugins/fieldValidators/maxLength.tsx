import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";
import { Bind } from "@webiny/form";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-max-length",
    validator: {
        name: "maxLength",
        label: "Max length",
        description: "Entered value must not be longer than the provided max length.",
        defaultMessage: "Value is too long.",
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
            const maxLengthValue = validator.settings.value;
            if (typeof maxLengthValue === "undefined") {
                return true;
            }
            return validation.validate(value, `maxLength:${maxLengthValue}`);
        }
    }
};
export default plugin;
