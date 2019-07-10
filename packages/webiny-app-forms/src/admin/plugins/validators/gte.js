import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { I18NInput } from "webiny-app-i18n/components";
import { Input } from "webiny-ui/Input";

export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-gte",
    validator: {
        id: "gte",
        label: "Greater or equal",
        description: "Entered value must be greater than the one configured to submit the form.",
        renderSettings({ Bind }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"value"} validators={["required", "numeric"]}>
                            <Input
                                type={"number"}
                                label={"Value"}
                                description={"This is the smallest value that will be allowed"}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind
                            name={"message"}
                            validators={["required"]}
                            defaultValue={"Value is too small."}
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
