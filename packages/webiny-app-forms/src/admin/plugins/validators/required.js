import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { I18NInput } from "webiny-app-i18n/components";

export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-required",
    validator: {
        name: "required",
        label: "Required",
        description: "You won't be able to submit the form if this field is empty",
        renderSettings({ Bind }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind
                            name={"message"}
                            validators={["required"]}
                            defaultValue={"Value is required."}
                        >
                            <I18NInput
                                label={"Message"}
                                description={"This message will be displayed to the user"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
