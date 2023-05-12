import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";
import { createInputField } from "./date/createDateInputField";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { getAvailableValidators } from "./date/availableValidators";
import { useModelField } from "~/admin/hooks";
import { Bind } from "@webiny/form";

function DateLteSettings() {
    const { field } = useModelField();
    const type = field.settings ? field.settings.type : undefined;
    const availableValidators = getAvailableValidators(type).join(",");
    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"settings.type"}>
                    {bind => {
                        if (bind.value !== type) {
                            bind.onChange(type);
                        }
                        return <></>;
                    }}
                </Bind>
                <Bind name={"settings.value"} validators={validation.create(availableValidators)}>
                    {bind => {
                        return (
                            <>
                                {createInputField(field, bind)}
                                <FormElementMessage>
                                    This is the latest date/time that will be allowed.
                                </FormElementMessage>
                            </>
                        );
                    }}
                </Bind>
            </Cell>
        </Grid>
    );
}

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-date-lte",
    validator: {
        name: "dateLte",
        label: "Earlier or equal",
        description: "Entered date/time must be equal or earlier compared to the provided date.",
        defaultMessage: `Date/time is later than the provided one.`,
        renderSettings() {
            return <DateLteSettings />;
        },
        validate: async (value, { validator }) => {
            const { value: lteValue, type } = validator.settings;
            if (typeof lteValue === "undefined") {
                return true;
            } else if (type === "time") {
                return validation.validate(value, `timeLte:${lteValue}`);
            }
            return validation.validate(value, `dateLte:${lteValue}`);
        }
    }
});
