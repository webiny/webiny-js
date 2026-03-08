import React from "react";
import type { CmsModelLayoutFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";
import type {
    CmsSeparatorLayoutField,
    CmsLayoutField
} from "@webiny/app-headless-cms-common/types/model.js";
import { ReactComponent as SeparatorIcon } from "@webiny/icons/line_style.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { Grid, IconButton, Input, Separator, Tabs, Text } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { Bind } from "@webiny/form";
import { PermissionsTab } from "~/admin/components/FieldEditor/EditFieldDialog/PermissionsTab/PermissionsTab.js";
import { RulesTab } from "~/admin/components/FieldEditor/EditFieldDialog/RulesTab/RulesTab.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import type { FieldOption } from "@webiny/app-headless-cms-common/Fields/fieldOptions.js";

const t = i18n.ns("app-headless-cms/admin/fields");

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

export const uiSeparatorField: CmsModelLayoutFieldTypePlugin = {
    type: "cms-editor-layout-field-type",
    name: "cms-editor-layout-field-type-separator",
    field: {
        type: "separator",
        label: t`Separator`,
        description: t`Show a visual separator between fields.`,
        icon: <SeparatorIcon />,
        canEditSettings: true,
        createField() {
            return {
                type: "separator",
                label: "Section",
                description: "Your description goes here"
            };
        },
        render({ field, onUpdate, onDelete }) {
            return (
                <SeparatorLayoutCell
                    field={field as CmsSeparatorLayoutField}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            );
        }
    }
};
