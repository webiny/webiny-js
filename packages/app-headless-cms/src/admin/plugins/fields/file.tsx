import React from "react";
import { ReactComponent as FileIcon } from "./icons/round_insert_drive_file-24px.svg";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-file",
    field: {
        type: "file",
        label: t`Files`,
        description: t`Images, videos and other files.`,
        icon: <FileIcon />,
        validators: ["required"],
        allowMultipleValues: true,
        allowPredefinedValues: false,
        allowIndexes: {
            singleValue: true,
            multipleValues: false
        },
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                }
            };
        }
    }
};

export default plugin;
