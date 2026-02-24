import React from "react";
import type { CmsModelFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import { ReactComponent as AlertIcon } from "@webiny/icons/warning.svg";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-headless-cms/admin/fields");

export const uiAlertField: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-ui-alert",
    field: {
        type: "ui:alert",
        label: t`Alert`,
        description: t`Show an alert field which is not stored in the database.`,
        icon: <AlertIcon />,
        allowLayout: false,
        hideInAdmin: false,
        allowList: false,
        canEditSettings: true,
        allowPredefinedValues: false,
        tags: undefined,
        createField() {
            return {
                type: "ui:alert",
                list: false,
                validation: undefined,
                listValidation: undefined,
                renderer: {
                    name: "uiAlert"
                }
            };
        }
    }
};
