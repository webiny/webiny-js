import React from "react";
import type { CmsModelFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import { ReactComponent as SeparatorIcon } from "@webiny/icons/line_style.svg";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-headless-cms/admin/fields");

export const uiSeparatorField: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-ui-separator",
    field: {
        type: "ui:separator",
        label: t`Separator`,
        description: t`Show a separator field which is not stored in the database.`,
        icon: <SeparatorIcon />,
        allowLayout: false,
        hideInAdmin: false,
        allowList: false,
        allowPredefinedValues: false,
        createField() {
            return {
                type: this.type,
                renderer: {
                    name: "uiSeparator"
                }
            };
        }
    }
};
