import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import OptionsSelectionDynamicFieldset from "./components/OptionsSelectionDynamicFieldset";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-select",
    fieldType: {
        dataType: true,
        id: "select",
        validators: ["required"],
        label: "Select",
        description: "Give users the ability to choose one option",
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
                            <OptionsSelectionDynamicFieldset Bind={Bind} />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
