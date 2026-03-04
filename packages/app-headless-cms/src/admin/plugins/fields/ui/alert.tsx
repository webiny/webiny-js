import React from "react";
import type { CmsLayoutFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import type {
    CmsAlertLayoutDescriptor,
    CmsLayoutDescriptor
} from "@webiny/app-headless-cms-common/types/model.js";
import { ReactComponent as AlertIcon } from "@webiny/icons/warning.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { Alert, Grid, IconButton, Tabs, Textarea, Select, Text } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { Bind } from "@webiny/form";
import { PermissionsTab } from "~/admin/components/FieldEditor/EditFieldDialog/PermissionsTab/PermissionsTab.js";
import { RulesTab } from "~/admin/components/FieldEditor/EditFieldDialog/RulesTab/RulesTab.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";

const t = i18n.ns("app-headless-cms/admin/fields");

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

interface AlertLayoutCellProps {
    descriptor: CmsAlertLayoutDescriptor;
    onUpdate: (d: CmsLayoutDescriptor) => void;
    onDelete: () => void;
}

const AlertLayoutCell = ({ descriptor, onUpdate, onDelete }: AlertLayoutCellProps) => {
    const { fieldOptions } = useModelEditor();
    const dialogs = useDialogs();

    const openSettings = () => {
        dialogs.showDialog({
            title: "Alert Settings",
            description: "Configure the alert and access permissions",
            acceptLabel: "Save",
            cancelLabel: "Cancel",
            formData: {
                label: descriptor.label,
                alertType: descriptor.alertType,
                rules: descriptor.rules ?? []
            },
            content: <AlertDialogContent fieldOptions={fieldOptions} />,
            onAccept: data => {
                onUpdate({
                    ...descriptor,
                    label: data.label ?? "",
                    alertType: (data.alertType as CmsAlertLayoutDescriptor["alertType"]) ?? "info",
                    rules: data.rules ?? []
                });
            }
        });
    };

    return (
        <div className={"flex items-center justify-between"}>
            <div className={"flex-1"}>
                {descriptor.label ? (
                    <Alert type={descriptor.alertType}>{descriptor.label}</Alert>
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

export const uiAlertField: CmsLayoutFieldTypePlugin = {
    type: "cms-editor-layout-field-type",
    name: "cms-editor-layout-field-type-alert",
    field: {
        type: "alert",
        label: t`Alert`,
        description: t`Show an alert message in the form.`,
        icon: <AlertIcon />,
        canEditSettings: true,
        createDescriptor() {
            return { type: "alert", label: "", alertType: "info" };
        },
        render({ descriptor, onUpdate, onDelete }) {
            return (
                <AlertLayoutCell
                    descriptor={descriptor as CmsAlertLayoutDescriptor}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            );
        }
    }
};
