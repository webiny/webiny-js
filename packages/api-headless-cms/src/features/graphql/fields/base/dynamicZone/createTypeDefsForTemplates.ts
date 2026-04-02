import type {
    ApiEndpoint,
    CmsDynamicZoneTemplate,
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField
} from "~/types/index.js";
import { createTypeName } from "~/utils/createTypeName.js";
import { createTypeFromFields } from "~/utils/createTypeFromFields.js";

interface CreateTypeDefsForTemplatesParams {
    models: CmsModel[];
    model: CmsModel;
    field: CmsModelField;
    type: ApiEndpoint;
    typeOfType: "type" | "input";
    templates: CmsDynamicZoneTemplate[];
    fieldTypePlugins: CmsFieldTypePlugins;
}

export const createTypeDefsForTemplates = ({
    models,
    model,
    field,
    type,
    templates,
    typeOfType,
    fieldTypePlugins
}: CreateTypeDefsForTemplatesParams) => {
    const typeDefs: string[] = [];
    const templateTypes: string[] = [];

    templates.forEach(template => {
        const typeName = [
            model.singularApiName,
            createTypeName(field.fieldId),
            template.gqlTypeName
        ].join("_");

        const result = createTypeFromFields({
            models,
            typeOfType,
            model,
            type,
            typeNamePrefix: typeName,
            fields: template.fields,
            fieldTypePlugins
        });

        if (!result) {
            return;
        }

        typeDefs.push(result.typeDefs);
        templateTypes.push(result.fieldType);
    });

    return { typeDefs, templateTypes };
};
