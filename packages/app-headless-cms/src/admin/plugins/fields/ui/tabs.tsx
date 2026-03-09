import React from "react";
import type { CmsModelLayoutFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsTabLayoutField } from "@webiny/app-headless-cms-common/types/model.js";
import { ReactComponent as TabsIcon } from "@webiny/icons/tab.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { TabsLayoutEditor } from "./TabsLayoutEditor.js";

const t = i18n.ns("app-headless-cms/admin/fields");

export const uiTabsField: CmsModelLayoutFieldTypePlugin = {
    type: "cms-editor-layout-field-type",
    name: "cms-editor-layout-field-type-tabs",
    field: {
        type: "tabs",
        label: t`Tabs`,
        description: t`Group fields into tabs.`,
        icon: <TabsIcon />,
        canEditSettings: true,
        createField() {
            return {
                type: "tabs",
                label: "Tabs",
                description: null,
                help: null,
                tabs: [{ id: generateAlphaNumericLowerCaseId(8), label: "Tab 1", layout: [] }]
            };
        },
        collectFields({ field, getField }) {
            const tabs = (field as CmsTabLayoutField).tabs;
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
        getFieldLabelPrefixes({ field }) {
            const tabsField = field as CmsTabLayoutField;
            const tabs = tabsField.tabs;
            if (!tabs) {
                return {};
            }
            const fieldLabel = tabsField.label || "Tabs";
            const prefixes: Record<string, string> = {};
            for (const tab of tabs) {
                const tabLabel = tab.label || "Tab";
                const prefix = `${fieldLabel} › ${tabLabel}`;
                for (const row of tab.layout) {
                    for (const cell of row) {
                        if (typeof cell === "string") {
                            prefixes[cell] = prefix;
                        }
                    }
                }
            }
            return prefixes;
        },
        render({ field, onUpdate, onDelete }) {
            return (
                <TabsLayoutEditor
                    field={field as CmsTabLayoutField}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            );
        }
    }
};
