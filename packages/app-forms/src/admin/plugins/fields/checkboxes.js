// @flow
import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as Icon } from "./icons/round-check_box-24px.svg";
import OptionsSelectionDynamicFieldset from "./components/OptionsSelectionDynamicFieldset";
import type { FormEditorFieldPluginType } from "@webiny/app-forms/types";

export default ({
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
                type: this.type,
                name: this.name,
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
}: FormEditorFieldPluginType);
