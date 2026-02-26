import React, { useState } from "react";
import type { CmsLayoutFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import type {
    CmsAlertLayoutDescriptor,
    CmsLayoutDescriptor
} from "@webiny/app-headless-cms-common/types/model.js";
import { ReactComponent as AlertIcon } from "@webiny/icons/warning.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { Alert, IconButton, Input, Select, Text } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields");

interface AlertLayoutCellProps {
    descriptor: CmsAlertLayoutDescriptor;
    onUpdate: (d: CmsLayoutDescriptor) => void;
    onDelete: () => void;
}

const AlertLayoutCell = ({ descriptor, onUpdate, onDelete }: AlertLayoutCellProps) => {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className={"flex flex-column gap-sm"}>
                <Input
                    label={"Label"}
                    value={descriptor.label}
                    onChange={value =>
                        onUpdate({ ...descriptor, label: value ?? "" })
                    }
                />
                <Select
                    label={"Alert type"}
                    value={descriptor.alertType}
                    onChange={value =>
                        onUpdate({
                            ...descriptor,
                            alertType: value as CmsAlertLayoutDescriptor["alertType"]
                        })
                    }
                    options={[
                        { value: "info", label: "Info" },
                        { value: "success", label: "Success" },
                        { value: "warning", label: "Warning" },
                        { value: "danger", label: "Danger" }
                    ]}
                />
                <div className={"flex justify-end"}>
                    <IconButton
                        icon={<EditIcon />}
                        onClick={() => setIsEditing(false)}
                        variant={"ghost"}
                        size={"sm"}
                    />
                </div>
            </div>
        );
    }

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
                    onClick={() => setIsEditing(true)}
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
