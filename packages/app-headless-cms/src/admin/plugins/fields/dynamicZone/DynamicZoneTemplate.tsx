import React, { useCallback, useState } from "react";
import { set } from "dot-prop-immutable";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { ReactComponent as ArrowUpIcon } from "@material-design-icons/svg/round/expand_less.svg";
import { ReactComponent as ArrowDownIcon } from "@material-design-icons/svg/round/expand_more.svg";
import { AccordionItem } from "@webiny/ui/Accordion";
import { useConfirmationDialog } from "@webiny/app-admin";
import { pullValueAtIndex, pushValueAtIndex, removeValueAtIndex } from "~/admin/plugins/arrayUtils";
import { CmsDynamicZoneTemplate, CmsEditorFieldsLayout, CmsModelField } from "~/types";
import { TemplateDialog } from "./TemplateDialog";
import { FieldEditor } from "~/admin/components/FieldEditor";

interface DynamicZoneTemplateProps {
    index: number;
    field: CmsModelField;
    template: CmsDynamicZoneTemplate;
    onChange: (field: CmsModelField) => void;
    open: boolean;
}

interface UpdateTemplate {
    (template: CmsDynamicZoneTemplate): void;
}

interface UpdateFieldsAndLayout {
    (params: { fields: CmsModelField[]; layout: CmsEditorFieldsLayout }): void;
}

const TEMPLATES_PATH = "settings.templates";

export const DynamicZoneTemplate = ({
    index,
    field,
    template,
    onChange,
    open
}: DynamicZoneTemplateProps) => {
    const { showConfirmation } = useConfirmationDialog({
        title: "Delete content template",
        message: "Are you sure you want to delete this content template?",
        acceptLabel: "Yes, I'm sure!"
    });

    const [templateToEdit, setTemplateToEdit] = useState<CmsDynamicZoneTemplate | undefined>(
        undefined
    );

    const templates = field.settings?.templates || [];
    const isFirst = index === 0;
    const isLast = index === templates.length - 1;

    const callbackDeps = [onChange, field, index, template.id];

    const onDialogClose = useCallback(() => {
        setTemplateToEdit(undefined);
    }, []);

    const editTemplate = useCallback(() => {
        setTemplateToEdit(template);
    }, [template]);

    const updateTemplate = useCallback<UpdateTemplate>(params => {
        onChange(
            set(field, `${TEMPLATES_PATH}.${index}`, (tpl: CmsDynamicZoneTemplate) => {
                return { ...tpl, ...params };
            })
        );
    }, callbackDeps);

    const updateFieldsAndLayout = useCallback<UpdateFieldsAndLayout>(
        params => {
            updateTemplate({ ...template, ...params });
        },
        [updateTemplate]
    );

    const moveTemplateUp = useCallback(() => {
        onChange(set(field, TEMPLATES_PATH, pullValueAtIndex(templates, index)));
    }, callbackDeps);

    const moveTemplateDown = useCallback(() => {
        onChange(set(field, TEMPLATES_PATH, pushValueAtIndex(templates, index)));
    }, callbackDeps);

    const deleteTemplate = useCallback(() => {
        showConfirmation(() => {
            onChange(set(field, TEMPLATES_PATH, removeValueAtIndex(templates, index)));
        });
    }, callbackDeps);

    return (
        <AccordionItem
            title={template.name}
            description={template.description}
            icon={<IconPicker.Icon icon={template.icon} />}
            open={open}
            actions={
                <AccordionItem.Actions>
                    <AccordionItem.Action
                        icon={<ArrowUpIcon />}
                        onClick={moveTemplateUp}
                        disabled={isFirst}
                    />
                    <AccordionItem.Action
                        icon={<ArrowDownIcon />}
                        onClick={moveTemplateDown}
                        disabled={isLast}
                    />
                    <AccordionItem.Divider />
                    <AccordionItem.Action icon={<EditIcon />} onClick={editTemplate} />
                    <AccordionItem.Action icon={<DeleteIcon />} onClick={deleteTemplate} />
                </AccordionItem.Actions>
            }
        >
            {templateToEdit ? (
                <TemplateDialog
                    template={templateToEdit}
                    onTemplate={updateTemplate}
                    onClose={onDialogClose}
                />
            ) : null}

            <FieldEditor
                parent={field}
                fields={template.fields}
                layout={template.layout}
                onChange={updateFieldsAndLayout}
            />
        </AccordionItem>
    );
};
