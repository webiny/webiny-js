import React from "react";
import { Grid } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { CmsModelFieldValidatorPlugin } from "~/types.js";

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
                <Grid.Column span={12}>
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
                </Grid.Column>
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
