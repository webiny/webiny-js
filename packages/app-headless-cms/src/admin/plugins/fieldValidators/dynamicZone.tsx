import React, { useMemo } from "react";
import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { AccordionItem } from "@webiny/ui/Accordion";
import { plugins } from "@webiny/plugins";
import { Bind } from "@webiny/form";
import { CmsDynamicZoneTemplate, CmsEditorFieldValidatorPlugin } from "~/types";
import { ValidatorsList } from "~/admin/components/FieldEditor/EditFieldDialog/ValidatorsList";
import { Validator } from "~/admin/components/FieldEditor/EditFieldDialog/getValidators";

function getValidator(name: string) {
    const allValidators = plugins.byType<CmsEditorFieldValidatorPlugin>(
        "cms-editor-field-validator"
    );
    const plugin = allValidators.find(v => v.validator.name === name);
    if (!plugin) {
        throw Error(`Missing "${name}" validator plugin!`);
    }
    return plugin.validator;
}

function TemplateValidationSettings() {
    const commonValidators = useMemo((): Validator[] => {
        return [
            { optional: true, validator: getValidator("minLength") },
            { optional: true, validator: getValidator("maxLength") }
        ];
    }, []);

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
                                        validators={commonValidators}
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

export const dynamicZoneFieldValidator: CmsEditorFieldValidatorPlugin = {
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-dynamic-zone",
    validator: {
        name: "dynamicZone",
        label: "",
        description: "",
        defaultMessage: "",
        renderCustomUi() {
            return <TemplateValidationSettings />;
        }
    }
};
