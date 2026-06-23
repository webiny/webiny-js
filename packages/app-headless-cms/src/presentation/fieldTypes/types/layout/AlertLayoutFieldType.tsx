import React from "react";
import { ReactComponent as AlertIcon } from "@webiny/icons/warning.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import {
    Alert,
    Grid,
    IconButton,
    Tabs,
    Textarea,
    Select,
    Text,
    ScrollArea
} from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { Bind } from "@webiny/form";
import type {
    CmsAlertLayoutField,
    CmsLayoutField
} from "@webiny/app-headless-cms-common/types/model.js";
import { PermissionsEditor } from "~/admin/components/FieldEditor/EditFieldDialog/PermissionsEditor/PermissionsEditor.js";
import { RulesEditor } from "~/admin/components/FieldEditor/EditFieldDialog/RulesEditor/RulesEditor.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";
import { CmsLayoutFieldType, type ICmsLayoutFieldType } from "../../abstractions.js";

const AlertSettings = () => {
    return (
        <Grid className={"mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"label"}>
                    <Textarea label={"Message"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"alertType"} defaultValue={"info"}>
                    <Select
                        displayResetAction={false}
                        label={"Alert type"}
                        options={[
                            { value: "info", label: "Info" },
                            { value: "success", label: "Success" },
                            { value: "warning", label: "Warning" },
                            { value: "danger", label: "Danger" }
                        ]}
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const AlertDialogContent = ({ fieldOptions }: { fieldOptions: FieldOption[] }) => {
    return (
        <ScrollArea className="max-h-[70vh] flex flex-col">
            <Tabs
                size={"md"}
                separator
                tabs={[
                    <Tabs.Tab
                        key={"alert"}
                        trigger={"Alert"}
                        value={"alert"}
                        content={<AlertSettings />}
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

interface AlertLayoutCellProps {
    field: CmsAlertLayoutField;
    onUpdate: (d: CmsLayoutField) => void;
    onDelete: () => void;
}

const AlertLayoutCell = ({ field, onUpdate, onDelete }: AlertLayoutCellProps) => {
    const { fieldOptions } = useModelEditor();
    const dialogs = useDialogs();

    const openSettings = () => {
        dialogs.showDialog({
            title: "Alert Settings",
            description: "Configure the alert and access permissions",
            acceptLabel: "Save",
            cancelLabel: "Cancel",
            formData: {
                label: field.label,
                alertType: field.alertType,
                rules: field.rules ?? []
            },
            content: <AlertDialogContent fieldOptions={fieldOptions} />,
            onAccept: data => {
                onUpdate({
                    ...field,
                    label: data.label ?? "",
                    alertType: (data.alertType as CmsAlertLayoutField["alertType"]) ?? "info",
                    rules: data.rules ?? []
                });
            }
        });
    };

    return (
        <div className={"flex items-center justify-between"}>
            <div className={"flex-1"}>
                {field.label ? (
                    <Alert type={field.alertType}>{field.label}</Alert>
                ) : (
                    <Text size={"sm"} className={"text-neutral-strong italic"}>
                        Alert (no message set)
                    </Text>
                )}
            </div>
            <div className={"flex items-center gap-xs ml-sm"}>
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

class AlertLayoutFieldTypeImpl implements ICmsLayoutFieldType {
    type = "alert";
    label = "Alert";
    description = "Show an alert message in the form.";
    icon = (<AlertIcon />) as React.ReactElement;
    canEditSettings = true;

    createField() {
        return { type: "alert" as const, label: "", alertType: "info" as const };
    }

    render({ field, onUpdate, onDelete }: Parameters<ICmsLayoutFieldType["render"]>[0]) {
        return (
            <AlertLayoutCell
                field={field as CmsAlertLayoutField}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );
    }
}

export const AlertLayoutFieldType = CmsLayoutFieldType.createImplementation({
    implementation: AlertLayoutFieldTypeImpl,
    dependencies: []
});
