import React from "react";
import { Grid, FormComponentNote } from "@webiny/admin-ui";
import { validation } from "@webiny/validation";
import type { CmsModelFieldValidatorPlugin } from "~/types.js";
import { createInputField } from "./date/createDateInputField.js";
import { getAvailableValidators } from "./date/availableValidators.js";

import { useModelField } from "~/admin/hooks/index.js";
import { Bind } from "@webiny/form";

function DateGteSettings() {
    const { field } = useModelField();
    const type = field.settings ? field.settings.type : undefined;
    const availableValidators = getAvailableValidators(type).join(",");
    return (
        <Grid.Column span={12}>
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
                            <FormComponentNote
                                text={"This is the earliest date/time that will be allowed."}
                            />
                        </>
                    );
                }}
            </Bind>
        </Grid.Column>
    );
}

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-date-gte",
    validator: {
        name: "dateGte",
        label: "Later or equal",
        description: "Entered date/time must be equal or later compared to the provided date.",
        defaultMessage: `Date/time is earlier than the provided one.`,
        renderSettings() {
            return <DateGteSettings />;
        },
        validate: async (value, { validator }) => {
            const { value: gteValue, type } = validator.settings;
            if (typeof gteValue === "undefined") {
                return true;
            } else if (type === "time") {
                return validation.validate(value, `timeGte:${gteValue}`);
            }
            return validation.validate(value, `dateGte:${gteValue}`);
        }
    }
});
