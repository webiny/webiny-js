import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as Icon } from "./icons/dropdown-icon.svg";
import OptionsSelectionDynamicFieldset from "./components/OptionsSelectionDynamicFieldset";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-select",
    fieldType: {
        dataType: true,
        id: "select",
        validators: ["required"],
        label: "Select",
        description: "Dropdown, select one of the options",
        icon: <Icon />,
        createField() {
            return {
                id: "",
                label: "",
                type: this.id,
                validation: []
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
