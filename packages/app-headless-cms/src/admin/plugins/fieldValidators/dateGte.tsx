import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "@webiny/app-headless-cms/types";
import { createInputField } from "./date/createDateInputField";
import { getAvailableValidators } from "./date/availableValidators";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

export default (): CmsEditorFieldValidatorPlugin => ({
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-date-gte",
    validator: {
        name: "dateGte",
        label: "Later or equal",
        description: "Entered date/time must be equal or later than the provided date.",
        defaultMessage: "Date/time is earlier or equal to provided one.",
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
    }
});
