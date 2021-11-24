import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Tags } from "@webiny/ui/Tags";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "~/types";

export default (): CmsEditorFieldValidatorPlugin => {
    return {
        type: "cms-editor-field-validator",
        name: "cms-editor-field-validator-in",
        validator: {
            name: "in",
            label: "Specific values",
            description:
                "You won't be able to submit the form if the field value is not in the list of specified values",
            defaultMessage: "Value is not allowed.",
            renderSettings({ Bind }) {
                return (
                    <Grid>
                        <Cell span={12}>
                            <Bind
                                name={"settings.values"}
                                validators={validation.create("required")}
                            >
                                <Tags
                                    label={"Allowed values"}
                                    description={"Hit ENTER to add values"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            }
        }
    };
};
