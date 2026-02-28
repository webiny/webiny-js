import React from "react";
import type { CmsLayoutFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsTabLayoutDescriptor } from "@webiny/app-headless-cms-common/types/model.js";
import { ReactComponent as TabsIcon } from "@webiny/icons/tab.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { TabsLayoutEditor } from "./TabsLayoutEditor.js";

const t = i18n.ns("app-headless-cms/admin/fields");

export const uiTabsField: CmsLayoutFieldTypePlugin = {
    type: "cms-editor-layout-field-type",
    name: "cms-editor-layout-field-type-tabs",
    field: {
        type: "tabs",
        label: t`Tabs`,
        description: t`Group fields into tabs.`,
        icon: <TabsIcon />,
        canEditSettings: true,
        createDescriptor() {
            return {
                type: "tabs",
                label: "Tabs",
                description: null,
                help: null,
                tabs: [{ id: generateAlphaNumericLowerCaseId(8), label: "Tab 1", layout: [] }]
            };
        },
        collectFields({ descriptor, getField }) {
            const tabs = (descriptor as CmsTabLayoutDescriptor).tabs;
            if (!tabs) {
                return [];
            }
            const result = [];
            for (const tab of tabs) {
                for (const row of tab.layout) {
                    for (const cell of row) {
                        if (typeof cell === "string") {
                            const f = getField(cell);
                            if (f) {
                                result.push(f);
                            }
                        }
                    }
                }
            }
            return result;
        },
        render({ descriptor, onUpdate, onDelete }) {
            return (
                <TabsLayoutEditor
                    descriptor={descriptor as CmsTabLayoutDescriptor}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            );
        }
    }
};
