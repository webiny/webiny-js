import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "@webiny/app-headless-cms/types";
import { createInputField } from "./date/createDateInputField";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { getAvailableValidators } from "./date/availableValidators";

export default (): CmsEditorFieldValidatorPlugin => ({
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-date-lte",
    validator: {
        name: "dateLte",
        label: "Earlier or equal",
        description: "Entered date/time must be equal or lesser than the provided max date.",
        defaultMessage: "Date/time is greater or equal to provided one.",
        renderSettings({ Bind, field }) {
            const type = field.settings.type;
            const availableValidators = getAvailableValidators(type).join(",");
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind
                            name={"settings.value"}
                            validators={validation.create(availableValidators)}
                        >
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
    }
});
