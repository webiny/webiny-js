import React, { useCallback, useRef, useEffect } from "react";
import { Accordion } from "@webiny/ui/Accordion/index.js";
import { AccordionItem } from "@webiny/ui/Accordion/index.js";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/expand_less.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import type {
    CmsTabLayoutDescriptor,
    CmsTabLayoutTab,
    CmsLayoutDescriptor,
    CmsEditorFieldsLayout
} from "@webiny/app-headless-cms-common/types/model.js";
import type { CmsModelField } from "~/types.js";
import { FieldEditor } from "~/admin/components/FieldEditor/index.js";
import { useModelFieldEditor } from "~/admin/hooks/index.js";
import { useConfirmationDialog } from "@webiny/app-admin";
import { IconButton, Button } from "@webiny/admin-ui";

interface TabsLayoutEditorProps {
    descriptor: CmsTabLayoutDescriptor;
    onUpdate: (d: CmsLayoutDescriptor) => void;
    onDelete: () => void;
}

interface TabItemProps {
    tab: CmsTabLayoutTab;
    index: number;
    totalTabs: number;
    descriptor: CmsTabLayoutDescriptor;
    parentFields: CmsModelField[];
    onUpdate: (d: CmsLayoutDescriptor) => void;
    onInsertField: (field: CmsModelField) => void;
    onRemoveField: (fieldId: string) => void;
    open: boolean;
}

/**
 * Resolve fields for a tab by looking up field IDs in the parent's fields array.
 */
function resolveTabFields(tab: CmsTabLayoutTab, parentFields: CmsModelField[]): CmsModelField[] {
    const fieldIds = new Set<string>();
    for (const row of tab.layout) {
        for (const cell of row) {
            if (typeof cell === "string") {
                fieldIds.add(cell);
            }
        }
    }
    return parentFields.filter(f => fieldIds.has(f.id));
}

const TabItem = ({
    tab,
    index,
    totalTabs,
    descriptor,
    parentFields,
    onUpdate,
    onInsertField,
    onRemoveField,
    open
}: TabItemProps) => {
    const { showConfirmation } = useConfirmationDialog({
        title: "Delete tab",
        message: `Are you sure you want to delete the tab "${tab.label}"? Fields inside this tab will be removed.`,
        acceptLabel: "Yes, delete tab"
    });

    const isFirst = index === 0;
    const isLast = index === totalTabs - 1;

    const tabFields = resolveTabFields(tab, parentFields);

    const handleFieldsChange = useCallback(
        ({ fields: newFields, layout: newLayout }: { fields: CmsModelField[]; layout: CmsEditorFieldsLayout }) => {
            const oldFieldIds = new Set(tabFields.map(f => f.id));
            const newFieldIds = new Set(newFields.map(f => f.id));

            // Find added fields (in new but not in old) -> hoist to parent
            for (const f of newFields) {
                if (!oldFieldIds.has(f.id)) {
                    onInsertField(f);
                }
            }

            // Find removed fields (in old but not in new) -> un-hoist from parent
            for (const id of oldFieldIds) {
                if (!newFieldIds.has(id)) {
                    onRemoveField(id);
                }
            }

            // Update the tab's layout in the descriptor
            const updatedTabs = [...descriptor.tabs];
            updatedTabs[index] = { ...tab, layout: newLayout };
            onUpdate({ ...descriptor, tabs: updatedTabs });
        },
        [tab, index, descriptor, tabFields, onUpdate, onInsertField, onRemoveField]
    );

    const moveTabUp = useCallback(() => {
        if (isFirst) return;
        const tabs = [...descriptor.tabs];
        [tabs[index - 1], tabs[index]] = [tabs[index], tabs[index - 1]];
        onUpdate({ ...descriptor, tabs });
    }, [descriptor, index, isFirst, onUpdate]);

    const moveTabDown = useCallback(() => {
        if (isLast) return;
        const tabs = [...descriptor.tabs];
        [tabs[index + 1], tabs[index]] = [tabs[index], tabs[index + 1]];
        onUpdate({ ...descriptor, tabs });
    }, [descriptor, index, isLast, onUpdate]);

    const deleteTab = useCallback(() => {
        showConfirmation(() => {
            // Collect field IDs to un-hoist
            for (const row of tab.layout) {
                for (const cell of row) {
                    if (typeof cell === "string") {
                        onRemoveField(cell);
                    }
                }
            }

            const tabs = descriptor.tabs.filter((_, i) => i !== index);
            onUpdate({ ...descriptor, tabs });
        });
    }, [descriptor, index, tab, onUpdate, onRemoveField, showConfirmation]);

    const renameTab = useCallback(() => {
        const newLabel = window.prompt("Tab label:", tab.label);
        if (newLabel !== null && newLabel !== tab.label) {
            const updatedTabs = [...descriptor.tabs];
            updatedTabs[index] = { ...tab, label: newLabel };
            onUpdate({ ...descriptor, tabs: updatedTabs });
        }
    }, [descriptor, index, tab, onUpdate]);

    return (
        <AccordionItem
            title={tab.label}
            description={`${tabFields.length} field${tabFields.length !== 1 ? "s" : ""}`}
            open={open}
            actions={
                <AccordionItem.Actions>
                    <AccordionItem.Action
                        icon={<ArrowUpIcon />}
                        onClick={moveTabUp}
                        disabled={isFirst}
                    />
                    <AccordionItem.Action
                        icon={<ArrowDownIcon />}
                        onClick={moveTabDown}
                        disabled={isLast}
                    />
                    <AccordionItem.Divider />
                    <AccordionItem.Action icon={<EditIcon />} onClick={renameTab} />
                    <AccordionItem.Action
                        icon={<DeleteIcon />}
                        onClick={deleteTab}
                        disabled={totalTabs <= 1}
                    />
                </AccordionItem.Actions>
            }
        >
            <FieldEditor
                fields={tabFields}
                layout={tab.layout}
                onChange={handleFieldsChange}
            />
        </AccordionItem>
    );
};

export const TabsLayoutEditor = ({ descriptor, onUpdate, onDelete }: TabsLayoutEditorProps) => {
    const parentEditor = useModelFieldEditor();
    const newTabId = useRef<string | undefined>(undefined);

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete tabs",
        message: "Are you sure you want to delete this tabs element? All fields inside the tabs will be removed.",
        acceptLabel: "Yes, delete"
    });

    useEffect(() => {
        newTabId.current = undefined;
    }, []);

    // Resolve all fields that exist in any tab of this descriptor from the parent's fields
    const getAllParentFields = useCallback((): CmsModelField[] => {
        // Collect all field IDs that exist in any tab of this descriptor
        const allFieldIds = new Set<string>();
        for (const tab of descriptor.tabs) {
            for (const row of tab.layout) {
                for (const cell of row) {
                    if (typeof cell === "string") {
                        allFieldIds.add(cell);
                    }
                }
            }
        }

        // Resolve them from the parent editor
        const resolved: CmsModelField[] = [];
        for (const id of allFieldIds) {
            const field = parentEditor.getField({ id });
            if (field) {
                resolved.push(field);
            }
        }
        return resolved;
    }, [descriptor, parentEditor]);

    const handleInsertField = useCallback(
        (field: CmsModelField) => {
            // Hoist the field to the parent context's fields (without placing in parent's layout)
            const existingField = parentEditor.getField({ id: field.id });
            if (!existingField) {
                parentEditor.addField(field);
            }
        },
        [parentEditor]
    );

    const handleRemoveField = useCallback(
        (fieldId: string) => {
            // Un-hoist the field from the parent context's fields
            parentEditor.removeField(fieldId);
        },
        [parentEditor]
    );

    const addTab = useCallback(() => {
        const id = generateAlphaNumericLowerCaseId(8);
        newTabId.current = id;
        const newTab: CmsTabLayoutTab = {
            id,
            label: `Tab ${descriptor.tabs.length + 1}`,
            layout: []
        };
        onUpdate({ ...descriptor, tabs: [...descriptor.tabs, newTab] });
    }, [descriptor, onUpdate]);

    const handleDeleteTabs = useCallback(() => {
        showDeleteConfirmation(() => {
            onDelete();
        });
    }, [onDelete, showDeleteConfirmation]);

    const resolvedParentFields = getAllParentFields();

    return (
        <div>
            <div className={"flex items-center justify-between mb-sm"}>
                <div className={"flex items-center gap-sm"}>
                    <span className={"font-semibold text-sm"}>Tabs</span>
                    {descriptor.label && (
                        <span className={"text-neutral-strong text-sm"}>
                            — {descriptor.label}
                        </span>
                    )}
                </div>
                <div className={"flex items-center gap-xs"}>
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={handleDeleteTabs}
                        variant={"ghost"}
                        size={"sm"}
                    />
                </div>
            </div>
            {descriptor.tabs.length > 0 && (
                <Accordion>
                    {descriptor.tabs.map((tab, index) => (
                        <TabItem
                            key={tab.id}
                            tab={tab}
                            index={index}
                            totalTabs={descriptor.tabs.length}
                            descriptor={descriptor}
                            parentFields={resolvedParentFields}
                            onUpdate={onUpdate}
                            onInsertField={handleInsertField}
                            onRemoveField={handleRemoveField}
                            open={tab.id === newTabId.current}
                        />
                    ))}
                </Accordion>
            )}
            <div className={"mt-sm flex justify-center"}>
                <Button onClick={addTab} text={"Add Tab"} icon={<AddIcon />} size={"sm"} />
            </div>
        </div>
    );
};
