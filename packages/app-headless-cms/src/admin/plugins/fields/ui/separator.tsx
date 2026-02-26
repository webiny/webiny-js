import React, { useState } from "react";
import type { CmsLayoutFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import type {
    CmsSeparatorLayoutDescriptor,
    CmsLayoutDescriptor
} from "@webiny/app-headless-cms-common/types/model.js";
import { ReactComponent as SeparatorIcon } from "@webiny/icons/line_style.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { IconButton, Input, Separator, Text } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields");

interface SeparatorLayoutCellProps {
    descriptor: CmsSeparatorLayoutDescriptor;
    onUpdate: (d: CmsLayoutDescriptor) => void;
    onDelete: () => void;
}

const SeparatorLayoutCell = ({ descriptor, onUpdate, onDelete }: SeparatorLayoutCellProps) => {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className={"flex flex-column gap-sm"}>
                <Input
                    label={"Label"}
                    value={descriptor.label}
                    onChange={value => onUpdate({ ...descriptor, label: value ?? "" })}
                />
                <Input
                    label={"Description"}
                    value={descriptor.description ?? ""}
                    onChange={value => onUpdate({ ...descriptor, description: value ?? "" })}
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
        <div className={"flex items-center gap-sm"}>
            <div className={"flex-1"}>
                <Separator variant={"accent"}>{descriptor.label}</Separator>
                {descriptor.description && (
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong text-center"}>
                        {descriptor.description}
                    </Text>
                )}
            </div>
            <div className={"flex items-center gap-xs"}>
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

export const uiSeparatorField: CmsLayoutFieldTypePlugin = {
    type: "cms-editor-layout-field-type",
    name: "cms-editor-layout-field-type-separator",
    field: {
        type: "separator",
        label: t`Separator`,
        description: t`Show a visual separator between fields.`,
        icon: <SeparatorIcon />,
        canEditSettings: true,
        createDescriptor() {
            return { type: "separator", label: "Section", description: "Your description goes here" };
        },
        render({ descriptor, onUpdate, onDelete }) {
            return (
                <SeparatorLayoutCell
                    descriptor={descriptor as CmsSeparatorLayoutDescriptor}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            );
        }
    }
};
