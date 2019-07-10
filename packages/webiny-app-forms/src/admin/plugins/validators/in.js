import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { I18NInput } from "webiny-app-i18n/components";
import { Tags } from "webiny-ui/Tags";

export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-in",
    validator: {
        id: "in",
        label: "Specific values",
        description:
            "You won't be able to submit the form if the field value is not in the list of specified values",
        renderSettings({ Bind }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"values"} validators={["required"]}>
                            <Tags
                                label={"Allowed values"}
                                description={"Hit ENTER to add values"}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind
                            name={"message"}
                            validators={["required"]}
                            defaultValue={"Value is not allowed."}
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
