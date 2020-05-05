import React from "react";
import { ReactComponent as BooleanIcon } from "./icons/toggle_on-black-24px.svg";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/fields");

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-boolean",
    field: {
        type: "boolean",
        name: "boolean",
        label: t`Boolean`,
        description: t`Store boolean ("yes" or "no" ) values.`,
        icon: <BooleanIcon />,
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
