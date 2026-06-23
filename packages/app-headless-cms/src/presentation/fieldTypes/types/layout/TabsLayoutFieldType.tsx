import React from "react";
import { ReactComponent as TabsIcon } from "@webiny/icons/tab.svg";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import type {
    CmsTabLayoutField,
    CmsLayoutField
} from "@webiny/app-headless-cms-common/types/model.js";
import type { CmsModelField } from "~/types.js";
import { CmsLayoutFieldType, type ICmsLayoutFieldType } from "../../abstractions.js";
import { TabsLayoutEditor } from "./TabsLayoutEditor.js";

class TabsLayoutFieldTypeImpl implements ICmsLayoutFieldType {
    type = "tabs";
    label = "Tabs";
    description = "Group fields into tabs.";
    icon = (<TabsIcon />) as React.ReactElement;
    canEditSettings = true;

    createField() {
        return {
            type: "tabs" as const,
            label: "Tabs",
            description: null,
            help: null,
            tabs: [{ id: generateAlphaNumericLowerCaseId(8), label: "Tab 1", layout: [] }]
        };
    }

    collectFields({
        field,
        getField
    }: Parameters<NonNullable<ICmsLayoutFieldType["collectFields"]>>[0]): CmsModelField[] {
        const tabs = (field as CmsTabLayoutField).tabs;
        if (!tabs) {
            return [];
        }
        const result: CmsModelField[] = [];
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
    }

    getFieldLabelPrefixes({
        field
    }: Parameters<NonNullable<ICmsLayoutFieldType["getFieldLabelPrefixes"]>>[0]): Record<
        string,
        string
    > {
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
    }

    render({ field, onUpdate, onDelete }: Parameters<ICmsLayoutFieldType["render"]>[0]) {
        return (
            <TabsLayoutEditor
                field={field as CmsTabLayoutField}
                onUpdate={onUpdate as (d: CmsLayoutField) => void}
                onDelete={onDelete}
            />
        );
    }
}

export const TabsLayoutFieldType = CmsLayoutFieldType.createImplementation({
    implementation: TabsLayoutFieldTypeImpl,
    dependencies: []
});
