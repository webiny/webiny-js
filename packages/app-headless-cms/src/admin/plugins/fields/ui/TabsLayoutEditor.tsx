import React, { useCallback, useRef, useEffect } from "react";
import { Accordion, Tabs } from "@webiny/admin-ui";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/expand_less.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import type {
    CmsTabLayoutField,
    CmsTabLayoutTab,
    CmsLayoutField,
    CmsEditorFieldsLayout
} from "@webiny/app-headless-cms-common/types/model.js";
import { useConfirmationDialog, useDialogs } from "@webiny/app-admin";
import { Grid } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Textarea } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import type { CmsModelField } from "~/types.js";
import { FieldEditor } from "~/admin/components/FieldEditor/index.js";
import { IconPicker } from "~/admin/components/IconPicker.js";
import { useModelFieldEditor } from "~/admin/hooks/index.js";
import { PermissionsTab } from "~/admin/components/FieldEditor/EditFieldDialog/PermissionsTab/PermissionsTab.js";
import { RulesTab } from "~/admin/components/FieldEditor/EditFieldDialog/RulesTab/RulesTab.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";

interface TabsLayoutEditorProps {
    field: CmsTabLayoutField;
    onUpdate: (d: CmsLayoutField) => void;
    onDelete: () => void;
}

interface TabItemProps {
    tab: CmsTabLayoutTab;
    index: number;
    totalTabs: number;
    field: CmsTabLayoutField;
    parentFields: CmsModelField[];
    onUpdate: (d: CmsLayoutField) => void;
    onInsertField: (field: CmsModelField) => void;
    onRemoveField: (fieldId: string) => void;
    onUpdateField: (field: CmsModelField) => void;
}

const TabsSettings = () => {
    return (
        <Grid className={"mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"label"}>
                    <Input label={"Label"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"description"}>
                    <Input label={"Description"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"help"}>
                    <Textarea label={"Help"} />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const TabsDialogContent = ({ fieldOptions }: { fieldOptions: FieldOption[] }) => {
    return (
        <Tabs
            size={"md"}
            separator
            tabs={[
                <Tabs.Tab
                    key={"tabs"}
                    trigger={"Tabs"}
                    value={"tabs"}
                    content={<TabsSettings />}
                />,
                <Tabs.Tab
                    key={"permissions"}
                    trigger={"Permissions"}
                    value={"permissions"}
                    content={<PermissionsTab gridClassName={"mt-md"} />}
                />,
                <Tabs.Tab
                    key={"rules"}
                    trigger={"Rules"}
                    value={"rules"}
                    content={<RulesTab gridClassName={"mt-md"} fieldOptions={fieldOptions} />}
                />
            ]}
        />
    );
};

const TabSettingsFields = () => {
    return (
        <Grid className={"mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"label"}>
                    <Input label={"Label"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"icon"}>
                    <IconPicker label={"Icon"} />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const TabDialogContent = ({ fieldOptions }: { fieldOptions: FieldOption[] }) => {
    return (
        <Tabs
            size={"md"}
            separator
            tabs={[
                <Tabs.Tab
                    key={"tab"}
                    trigger={"Tab"}
                    value={"tab"}
                    content={<TabSettingsFields />}
                />,
                <Tabs.Tab
                    key={"permissions"}
                    trigger={"Permissions"}
                    value={"permissions"}
                    content={<PermissionsTab gridClassName={"mt-md"} />}
                />,
                <Tabs.Tab
                    key={"rules"}
                    trigger={"Rules"}
                    value={"rules"}
                    content={<RulesTab gridClassName={"mt-md"} fieldOptions={fieldOptions} />}
                />
            ]}
        />
    );
};

/**
 * Create a synthetic parent field for a tab so that each tab's FieldEditor
 * has a unique identity for cross-parent drag & drop detection.
 */
function createTabParent(tab: CmsTabLayoutTab): CmsModelField {
    return {
        id: tab.id,
        fieldId: `tab:${tab.id}`,
        type: "tab",
        label: tab.label,
        renderer: { name: "" }
    } as CmsModelField;
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
    field,
    parentFields,
    onUpdate,
    onInsertField,
    onRemoveField,
    onUpdateField
}: TabItemProps) => {
    const { fieldOptions } = useModelEditor();
    const dialogs = useDialogs();

    const { showConfirmation } = useConfirmationDialog({
        title: "Delete tab",
        message: `Are you sure you want to delete the tab "${tab.label}"? Fields inside this tab will be removed.`,
        acceptLabel: "Yes, delete tab"
    });

    const isFirst = index === 0;
    const isLast = index === totalTabs - 1;

    const tabFields = resolveTabFields(tab, parentFields);

    const handleFieldsChange = useCallback(
        ({
            fields: newFields,
            layout: newLayout
        }: {
            fields: CmsModelField[];
            layout: CmsEditorFieldsLayout;
        }) => {
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

            // Propagate field updates (e.g. permissions changes) to the parent
            const oldFieldMap = new Map(tabFields.map(f => [f.id, f]));
            for (const f of newFields) {
                if (oldFieldMap.has(f.id) && oldFieldMap.get(f.id) !== f) {
                    onUpdateField(f);
                }
            }

            // Update the tab's layout in the field
            const updatedTabs = [...field.tabs];
            updatedTabs[index] = { ...tab, layout: newLayout };
            onUpdate({ ...field, tabs: updatedTabs });
        },
        [tab, index, field, tabFields, onUpdate, onInsertField, onRemoveField, onUpdateField]
    );

    const moveTabUp = useCallback(() => {
        if (isFirst) {
            return;
        }
        const tabs = [...field.tabs];
        [tabs[index - 1], tabs[index]] = [tabs[index], tabs[index - 1]];
        onUpdate({ ...field, tabs });
    }, [field, index, isFirst, onUpdate]);

    const moveTabDown = useCallback(() => {
        if (isLast) {
            return;
        }
        const tabs = [...field.tabs];
        [tabs[index + 1], tabs[index]] = [tabs[index], tabs[index + 1]];
        onUpdate({ ...field, tabs });
    }, [field, index, isLast, onUpdate]);

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

            const tabs = field.tabs.filter((_, i) => i !== index);
            onUpdate({ ...field, tabs });
        });
    }, [field, index, tab, onUpdate, onRemoveField, showConfirmation]);

    const editTab = useCallback(() => {
        dialogs.showDialog({
            title: "Tab Settings",
            description: "Configure the tab and access permissions",
            acceptLabel: "Save",
            cancelLabel: "Cancel",
            formData: {
                label: tab.label,
                icon: tab.icon ?? "",
                rules: tab.rules ?? []
            },
            content: <TabDialogContent fieldOptions={fieldOptions} />,
            onAccept: data => {
                const updatedTabs = [...field.tabs];
                updatedTabs[index] = {
                    ...tab,
                    label: data.label ?? tab.label,
                    icon: data.icon || undefined,
                    rules: data.rules ?? []
                };
                onUpdate({ ...field, tabs: updatedTabs });
            }
        });
    }, [dialogs, field, index, tab, onUpdate]);

    return (
        <Accordion.Item
            title={tab.label}
            /* This ensures drop zones are not affected by `overflow-hidden` on the accordion content. */
            className={"[&>[data-state='open']]:!overflow-visible"}
            description={`${tabFields.length} field${tabFields.length !== 1 ? "s" : ""}`}
            actions={
                <>
                    <Accordion.Item.Action
                        icon={<ArrowUpIcon />}
                        onClick={moveTabUp}
                        disabled={isFirst}
                    />
                    <Accordion.Item.Action
                        icon={<ArrowDownIcon />}
                        onClick={moveTabDown}
                        disabled={isLast}
                    />
                    <Accordion.Item.Action.Separator />
                    <Accordion.Item.Action icon={<EditIcon />} onClick={editTab} />
                    <Accordion.Item.Action
                        icon={<DeleteIcon />}
                        onClick={deleteTab}
                        disabled={totalTabs <= 1}
                    />
                </>
            }
        >
            <FieldEditor
                parent={createTabParent(tab)}
                fields={tabFields}
                layout={tab.layout}
                onChange={handleFieldsChange}
            />
        </Accordion.Item>
    );
};

export const TabsLayoutEditor = ({ field, onUpdate, onDelete }: TabsLayoutEditorProps) => {
    const parentEditor = useModelFieldEditor();
    const { fieldOptions } = useModelEditor();
    const { showDialog } = useDialogs();
    const newTabId = useRef<string | undefined>(undefined);

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete tabs",
        message:
            "Are you sure you want to delete this tabs element? All fields inside the tabs will be removed.",
        acceptLabel: "Yes, delete"
    });

    useEffect(() => {
        newTabId.current = undefined;
    }, []);

    // Resolve all fields that exist in any tab of this field from the parent's fields
    const getAllParentFields = useCallback((): CmsModelField[] => {
        // Collect all field IDs that exist in any tab of this field
        const allFieldIds = new Set<string>();
        for (const tab of field.tabs) {
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
            const f = parentEditor.getField({ id });
            if (f) {
                resolved.push(f);
            }
        }
        return resolved;
    }, [field, parentEditor]);

    const handleInsertField = useCallback(
        (f: CmsModelField) => {
            // Hoist the field to the parent context's fields (without placing in parent's layout)
            const existingField = parentEditor.getField({ id: f.id });
            if (!existingField) {
                parentEditor.addField(f);
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

    const handleUpdateField = useCallback(
        (f: CmsModelField) => {
            parentEditor.updateField(f);
        },
        [parentEditor]
    );

    const addTab = useCallback(() => {
        const id = generateAlphaNumericLowerCaseId(8);
        newTabId.current = id;
        const newTab: CmsTabLayoutTab = {
            id,
            label: `Tab ${field.tabs.length + 1}`,
            layout: []
        };
        onUpdate({ ...field, tabs: [...field.tabs, newTab] });
    }, [field, onUpdate]);

    const handleDeleteTabs = useCallback(() => {
        showDeleteConfirmation(() => {
            onDelete();
        });
    }, [onDelete, showDeleteConfirmation]);

    const editTabsSettings = useCallback(() => {
        showDialog({
            title: "Tabs Settings",
            description: "Configure the tabs and access permissions",
            acceptLabel: "Save",
            cancelLabel: "Cancel",
            formData: {
                label: field.label ?? "",
                description: field.description ?? "",
                help: field.help ?? "",
                rules: field.rules ?? []
            },
            content: <TabsDialogContent fieldOptions={fieldOptions} />,
            onAccept: data => {
                onUpdate({
                    ...field,
                    label: data.label ?? "",
                    description: data.description || null,
                    help: data.help || null,
                    rules: data.rules ?? []
                });
            }
        });
    }, [field, onUpdate]);

    const resolvedParentFields = getAllParentFields();

    return (
        <div>
            <div className={"flex justify-between"}>
                <div className={"flex flex-col"}>
                    <div className={"flex flex-row items-center"}>
                        <Heading level={6} className={"text-nowrap"}>
                            {field.label || "No label"}
                        </Heading>
                    </div>
                    <Text size="sm" className={"flex w-full text-neutral-strong"}>
                        Tabs
                    </Text>
                </div>
                <div className={"flex items-center gap-xs"}>
                    <IconButton
                        icon={<EditIcon />}
                        onClick={editTabsSettings}
                        variant={"ghost"}
                        size={"sm"}
                    />
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={handleDeleteTabs}
                        variant={"ghost"}
                        size={"sm"}
                    />
                </div>
            </div>
            {field.tabs.length > 0 && (
                <Accordion>
                    {field.tabs.map((tab, index) => (
                        <TabItem
                            key={tab.id}
                            tab={tab}
                            index={index}
                            totalTabs={field.tabs.length}
                            field={field}
                            parentFields={resolvedParentFields}
                            onUpdate={onUpdate}
                            onInsertField={handleInsertField}
                            onRemoveField={handleRemoveField}
                            onUpdateField={handleUpdateField}
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
