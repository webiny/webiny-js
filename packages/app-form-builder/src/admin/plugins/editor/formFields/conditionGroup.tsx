import React from "react";
import { FbBuilderFieldPlugin } from "~/types";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-condition-group",
    field: {
        type: "condition-group",
        name: "conditionGroup",
        label: "Condition Group",
        description: "Condition Group, show or hide group based on rule",
        icon: <TextIcon />,
        createField() {
            return {
                fieldId: "",
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: "",
                    layout: []
                }
            };
        },
        renderSettings() {
            return null;
        }
    }
};

export default plugin;
