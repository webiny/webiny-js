import React from "react";
import { ReactComponent as JsonIcon } from "@webiny/icons/data_object.svg";
import type { CmsModelFieldTypePlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-json",
    field: {
        type: "json",
        label: t`JSON`,
        description: t`Store JSON values.`,
        icon: <JsonIcon />,
        allowList: true,
        allowPredefinedValues: true,
        listLabel: t`Use as a list of JSONs`,
        hideInAdmin: true,
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                },
                settings: {
                    defaultValue: false
                }
            };
        }
    }
};

export default plugin;
