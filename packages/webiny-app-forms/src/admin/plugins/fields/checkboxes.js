import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as Icon } from "./icons/round-check_box-24px.svg";
import OptionsSelectionDynamicFieldset from "./components/OptionsSelectionDynamicFieldset";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-checkbox",
    fieldType: {
        dataType: true,
        id: "checkbox",
        validators: ["required"],
        label: "Checkboxes",
        description: "Choose one or more options",
        icon: <Icon />,
        createField() {
            return {
                _id: "",
                label: "",
                type: this.id,
                validation: [],
                settings: {
                    defaultValue: []
                }

            };
        },
        renderSettings({ form }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <OptionsSelectionDynamicFieldset form={form} multiple />
                    </Cell>
                </Grid>
            );
        }
    }
};
