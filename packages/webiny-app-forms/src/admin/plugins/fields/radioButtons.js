import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as Icon } from "./icons/round-radio_button_checked-24px.svg";
import OptionsSelectionDynamicFieldset from "./components/OptionsSelectionDynamicFieldset";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-radio",
    fieldType: {
        dataType: true,
        id: "radio",
        validators: ["required"],
        label: "Radio",
        description: "Choose a single option",
        icon: <Icon />,
        createField() {
            return {
                id: "",
                label: "",
                type: this.id,
                validation: [],
                defaultValue: ""
            };
        },
        renderSettings({ form }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <OptionsSelectionDynamicFieldset form={form} />
                    </Cell>
                </Grid>
            );
        }
    }
};
