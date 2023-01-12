import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";
import { Bind } from "@webiny/form";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
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
        },
        validate: async (value, { validator }) => {
            const gteValue = validator.settings.value;
            if (typeof gteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `gte:${gteValue}`);
        }
    }
};
export default plugin;
