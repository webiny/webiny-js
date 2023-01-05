import React from "react";
import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Bind } from "@webiny/form";
import {
    CmsDynamicZoneTemplate,
    CmsModelFieldValidatorConfig,
    CmsModelFieldValidatorPlugin
} from "~/types";
import { ValidatorsList } from "~/admin/components/FieldEditor/EditFieldDialog/ValidatorsList";
import { createValidators } from "~/admin/components/ContentEntryForm/functions/createValidators";
import { CmsModelFieldValidatorConfigAdapter } from "~/utils/CmsModelFieldValidatorConfigAdapter";
import { useModelField } from "~/admin/components/ModelFieldProvider";
import { commonValidators } from "~/admin/plugins/fields/dynamicZone/commonValidators";

function TemplateValidationSettings() {
    const { field } = useModelField();

    const validators: CmsModelFieldValidatorConfig[] = commonValidators.map(validator => {
        return {
            ...validator,
            variables: [
                ...(validator.variables || []),
                {
                    name: "templateName",
                    description: "This will be interpreted as the current template name."
                }
            ]
        };
    });

    return (
        <Bind<CmsDynamicZoneTemplate[]> name={"settings.templates"}>
            {({ value: templates }) => {
                return (
                    <>
                        {templates.map((template, index) => {
                            const icon = template.icon
                                ? (template.icon.split("/") as FontAwesomeIconProps["icon"])
                                : undefined;

                            return (
                                <AccordionItem
                                    key={template.id}
                                    title={template.name}
                                    description={template.description}
                                    icon={icon ? <FontAwesomeIcon icon={icon} /> : undefined}
                                >
                                    <ValidatorsList
                                        name={`settings.templates.${index}.validation`}
                                        validators={validators.map(
                                            v => new CmsModelFieldValidatorConfigAdapter(field, v)
                                        )}
                                    />
                                </AccordionItem>
                            );
                        })}
                    </>
                );
            }}
        </Bind>
    );
}

interface TemplateValue {
    _templateId: string;
    [key: string]: any;
}

export const dynamicZoneFieldValidator: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-dynamic-zone",
    validator: {
        name: "dynamicZone",
        label: "",
        description: "",
        defaultMessage: "",
        renderCustomUi() {
            return <TemplateValidationSettings />;
        },
        validate: async (value: TemplateValue[], _, field) => {
            // This validator only runs for Dynamic Zone fields with `multipleValues=true`.
            const templates = field.settings?.templates || [];
            for (const template of templates) {
                const validationRules = template.validation || [];
                const templateValue = (value || []).filter(v => v._templateId === template.id);
                const validators = createValidators(field, validationRules);
                for (const validator of validators) {
                    try {
                        await validator(templateValue);
                    } catch (e) {
                        const messageWithTemplate = e.message.replace(
                            /\{templateName\}/g,
                            template.name
                        );
                        throw new Error(messageWithTemplate);
                    }
                }
            }
        }
    }
};
