import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "~/types";
import { createInputField } from "./date/createDateInputField";
import { getAvailableValidators } from "./date/availableValidators";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { useModelField } from "~/admin/hooks";
import { Bind } from "@webiny/form";

function DateGteSettings() {
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
                                    This is the earliest date/time that will be allowed.
                                </FormElementMessage>
                            </>
                        );
                    }}
                </Bind>
            </Cell>
        </Grid>
    );
}

export default (): CmsEditorFieldValidatorPlugin => ({
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-date-gte",
    validator: {
        name: "dateGte",
        label: "Later or equal",
        description: "Entered date/time must be equal or later compared to the provided date.",
        defaultMessage: `Date/time is earlier than the provided one.`,
        renderSettings() {
            return <DateGteSettings />;
        }
    }
});
