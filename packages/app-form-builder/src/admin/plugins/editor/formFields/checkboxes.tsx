import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as Icon } from "./icons/round-check_box-24px.svg";
import OptionsList from "./components/OptionsList";
import { FbBuilderFieldPlugin } from "~/types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-checkbox",
    field: {
        type: "checkbox",
        name: "checkbox",
        validators: ["required"],
        label: "Checkboxes",
        description: "Choose one or more options",
        icon: <Icon />,
        createField() {
            return {
                _id: "",
                fieldId: "",
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: [],
                    otherOption: false
                }
            };
        },
        renderSettings({ form }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <OptionsList form={form} multiple otherOption />
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
