import React from "react";
import { ReactComponent as BooleanIcon } from "./icons/toggle_on-black-24px.svg";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-boolean",
    field: {
        type: "boolean",
        name: "boolean",
        label: "Boolean",
        description: "ID, order boolean, rating, quantity",
        icon: BooleanIcon,
        validators: ["required", "gte", "lte", "in"],
        createField() {
            return {
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: ""
                }
            };
        }
    }
};

export default plugin;
