import React from "react";
import { ReactComponent as SeparatorIcon } from "@webiny/icons/line_style.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { Grid, IconButton, Input, ScrollArea, Separator, Tabs, Text } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { Bind } from "@webiny/form";
import type {
    CmsLayoutField,
    CmsSeparatorLayoutField
} from "@webiny/app-headless-cms-common/types/model.js";
import { PermissionsEditor } from "~/admin/components/FieldEditor/EditFieldDialog/PermissionsEditor/PermissionsEditor.js";
import { RulesEditor } from "~/admin/components/FieldEditor/EditFieldDialog/RulesEditor/RulesEditor.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";
import { CmsLayoutFieldType, type ICmsLayoutFieldType } from "../../abstractions.js";

const SeparatorSettings = () => {
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
        </Grid>
    );
};

const SeparatorDialogContent = ({ fieldOptions }: { fieldOptions: FieldOption[] }) => {
    return (
        <ScrollArea className="max-h-[70vh] flex flex-col">
            <Tabs
                size={"md"}
                separator
                tabs={[
                    <Tabs.Tab
                        key={"separator"}
                        trigger={"Separator"}
                        value={"separator"}
                        content={<SeparatorSettings />}
                    />,
                    <Tabs.Tab
                        key={"permissions"}
                        trigger={"Permissions"}
                        value={"permissions"}
                        content={
                            <div className={"mt-md"}>
                                <PermissionsEditor />
                            </div>
                        }
                    />,
                    <Tabs.Tab
                        key={"rules"}
                        trigger={"Rules"}
                        value={"rules"}
                        content={
                            <div className={"mt-md"}>
                                <RulesEditor fieldOptions={fieldOptions} />
                            </div>
                        }
                    />
                ]}
            />
        </ScrollArea>
    );
};

interface SeparatorLayoutCellProps {
    field: CmsSeparatorLayoutField;
    onUpdate: (d: CmsLayoutField) => void;
    onDelete: () => void;
}

const SeparatorLayoutCell = ({ field, onUpdate, onDelete }: SeparatorLayoutCellProps) => {
    const { fieldOptions } = useModelEditor();
    const dialogs = useDialogs();

    const openSettings = () => {
        dialogs.showDialog({
            title: "Separator Settings",
            description: "Configure the separator and access permissions",
            acceptLabel: "Save",
            cancelLabel: "Cancel",
            formData: {
                label: field.label,
                description: field.description ?? "",
                rules: field.rules ?? []
            },
            content: <SeparatorDialogContent fieldOptions={fieldOptions} />,
            onAccept: data => {
                onUpdate({
                    ...field,
                    label: data.label ?? "",
                    description: data.description ?? "",
                    rules: data.rules ?? []
                });
            }
        });
    };

    return (
        <div className={"flex items-center gap-sm"}>
            <div className={"flex-1"}>
                <Separator variant={"accent"} labelPosition={"start"}>
                    {field.label}
                </Separator>
                {field.description && (
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong mt-sm"}>
                        {field.description}
                    </Text>
                )}
            </div>
            <div className={"flex items-center gap-xs"}>
                <IconButton
                    icon={<EditIcon />}
                    onClick={openSettings}
                    variant={"ghost"}
                    size={"sm"}
                />
                <IconButton
                    icon={<DeleteIcon />}
                    onClick={onDelete}
                    variant={"ghost"}
                    size={"sm"}
                />
            </div>
        </div>
    );
};

class SeparatorLayoutFieldTypeImpl implements ICmsLayoutFieldType {
    type = "separator";
    label = "Separator";
    description = "Show a visual separator between fields.";
    icon = (<SeparatorIcon />) as React.ReactElement;
    canEditSettings = true;

    createField() {
        return {
            type: "separator" as const,
            label: "Section",
            description: "Your description goes here"
        };
    }

    render({ field, onUpdate, onDelete }: Parameters<ICmsLayoutFieldType["render"]>[0]) {
        return (
            <SeparatorLayoutCell
                field={field as CmsSeparatorLayoutField}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );
    }
}

export const SeparatorLayoutFieldType = CmsLayoutFieldType.createImplementation({
    implementation: SeparatorLayoutFieldTypeImpl,
    dependencies: []
});
