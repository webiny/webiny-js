import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import OptionsSelectionDynamicFieldset from "./components/OptionsSelectionDynamicFieldset";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-checkbox",
    fieldType: {
        dataType: true,
        id: "checkbox",
        validators: ["required"],
        label: "Checkboxes",
        description: "Give users the ability to choose one or more options",
        icon: <TextIcon />,
        createField() {
            return {
                id: "",
                label: "",
                type: this.id,
                validation: []
            };
        },
        renderSettings({ Bind }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"options"}>
                            <OptionsSelectionDynamicFieldset Bind={Bind} multiple />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
