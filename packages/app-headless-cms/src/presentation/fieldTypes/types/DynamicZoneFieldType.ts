import { CmsFieldType } from "../abstractions.js";
import type { CmsModelFieldValidatorsGroup } from "@webiny/app-headless-cms-common/types/validation.js";

const listValidators: CmsModelFieldValidatorsGroup = {
    validators: ["minLength", "maxLength"],
    title: "List validators",
    description: "These validators are applied to the entire dynamic zone."
};

class DynamicZoneFieldTypeImpl implements CmsFieldType.Interface {
    type = "dynamicZone";
    label = "Dynamic Zone";
    description = "Define content templates to be used during content creation.";
    icon = "fas/dynamic-form";
    allowList = true;
    listLabel = "Use as a list of values";
    allowPredefinedValues = false;
    validators = (field: any) => {
        if (field.list) {
            return {
                validators: ["dynamicZone"],
                title: "Template Validators",
                description: "Validators for each of the templates in this dynamic zone."
            };
        }
        return ["required"];
    };
    listValidators = listValidators;

    createField() {
        return {
            type: this.type,
            listValidation: [{ name: "dynamicZone" }],
            renderer: { name: "dynamicZone" },
            settings: { templates: [] }
        };
    }
}

export const DynamicZoneFieldType = CmsFieldType.createImplementation({
    implementation: DynamicZoneFieldTypeImpl,
    dependencies: []
});
