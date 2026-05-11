import React from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { validation } from "@webiny/validation";
import type { CmsModelFieldValidatorPlugin } from "~/types.js";
import { Bind } from "@webiny/form";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-lte",
    validator: {
        name: "lte",
        label: "Smaller or equal",
        description: "Entered value must be equal or lower than the provided min value.",
        defaultMessage: "Value is too great.",
        renderSettings() {
            return (
                <Grid.Column span={12}>
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
                </Grid.Column>
            );
        },
        validate: async (value, { validator }) => {
            const lteValue = validator.settings.value;
            if (typeof lteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `lte:${lteValue}`);
        }
    }
};
export default plugin;
