import React, { useRef, useEffect, useState, useCallback } from "react";
import { Accordion } from "@webiny/admin-ui";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { AddTemplateIcon, AddTemplateButton } from "./AddTemplate.js";
import { DynamicZoneTemplate } from "./DynamicZoneTemplate.js";
import { TemplateDialog } from "./TemplateDialog.js";
import { useModelField, useModelFieldEditor } from "~/admin/hooks/index.js";

function updateOrCreateTemplate(
    templates: CmsDynamicZoneTemplate[],
    template: CmsDynamicZoneTemplate
) {
    const templateIndex = templates.findIndex(tpl => tpl.id === template.id);

    if (templateIndex > -1) {
        return [
            ...templates.slice(0, templateIndex),
            template,
            ...templates.slice(templateIndex + 1)
        ];
    }

    return [...templates, template];
}

export const DynamicZone = () => {
    const { field } = useModelField();
    const { updateField } = useModelFieldEditor();
    const newTemplateId = useRef<string | undefined>(undefined);
    const [templateToEdit, setTemplateToEdit] = useState<CmsDynamicZoneTemplate | undefined>(
        undefined
    );

    const templates: CmsDynamicZoneTemplate[] = field.settings?.templates || [];

    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        const templates = field.settings?.templates || [];

        newTemplateId.current = template.id;

        updateField({
            ...field,
            settings: {
                ...(field.settings || {}),
                templates: updateOrCreateTemplate(templates, template)
            }
        });
    };

    const onDialogClose = useCallback(() => {
        setTemplateToEdit(undefined);
    }, []);

    useEffect(() => {
        newTemplateId.current = undefined;
    }, []);

    return (
        <>
            {templateToEdit ? (
                <TemplateDialog
                    template={templateToEdit}
                    onTemplate={onTemplate}
                    onClose={onDialogClose}
                />
            ) : null}
            {templates.length ? (
                <Accordion>
                    {templates.map((template, index) => (
                        <DynamicZoneTemplate
                            key={template.id}
                            open={template.id === newTemplateId.current}
                            index={index}
                            field={field}
                            template={template}
                            onChange={updateField}
                            onEditTemplate={setTemplateToEdit}
                        />
                    ))}
                </Accordion>
            ) : null}
            {templates.length ? (
                <AddTemplateIcon onTemplate={onTemplate} />
            ) : (
                <AddTemplateButton onTemplate={onTemplate} />
            )}
        </>
    );
};
