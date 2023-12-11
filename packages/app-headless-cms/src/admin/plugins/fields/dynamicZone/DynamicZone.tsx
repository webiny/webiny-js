import React, { useRef, useEffect } from "react";
import { Accordion } from "@webiny/ui/Accordion";
import { CmsDynamicZoneTemplate } from "~/types";
import { AddTemplateIcon, AddTemplateButton } from "./AddTemplate";
import { DynamicZoneTemplate } from "./DynamicZoneTemplate";
import { useModelField, useModelFieldEditor } from "~/admin/hooks";

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

    useEffect(() => {
        // We only want to open the accordion item on first mount of a new template.
        newTemplateId.current = undefined;
    }, []);

    return (
        <>
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
