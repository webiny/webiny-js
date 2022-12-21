import {
    CmsEntry,
    CmsContext,
    CmsModelFieldToGraphQLPlugin,
    CmsModel,
    CmsModelField,
    CmsModelDynamicZoneField,
    CmsDynamicZoneTemplate
} from "~/types";
import { createReadTypeName } from "~/utils/createTypeName";
import { createTypeFromFields } from "~/utils/createTypeFromFields";
// import { createGraphQLInputField } from "./helpers";

interface RefFieldValue {
    id: string;
    modelId: string;
}

const createUnionTypeName = (model: CmsModel, field: CmsModelField) => {
    return `${createReadTypeName(model.modelId)}_${createReadTypeName(field.fieldId)}`;
};

const getFieldTemplates = (field: CmsModelField): CmsDynamicZoneTemplate[] => {
    if (!field.settings || !Array.isArray(field.settings.templates)) {
        return [];
    }
    return field.settings.templates;
};

const appendTypename = (entries: CmsEntry[], typename: string): CmsEntry[] => {
    return entries.map(item => {
        return {
            ...item,
            __typename: typename
        };
    });
};

export const createDynamicZoneField =
    (): CmsModelFieldToGraphQLPlugin<CmsModelDynamicZoneField> => {
        return {
            name: "cms-model-field-to-graphql-dynamic-zone",
            type: "cms-model-field-to-graphql",
            fieldType: "dynamicZone",
            isSortable: false,
            isSearchable: false,
            read: {
                createTypeField({ model, field, fieldTypePlugins }) {
                    const templates = getFieldTemplates(field);
                    const unionTypeName = createUnionTypeName(model, field);

                    const typeDefs: string[] = [];
                    const templateTypes: string[] = [];

                    templates.forEach(template => {
                        const result = createTypeFromFields({
                            typeOfType: "type",
                            model,
                            type: "read",
                            fieldId: field.fieldId,
                            fields: template.fields,
                            fieldTypePlugins
                        });

                        if (!result) {
                            return;
                        }

                        typeDefs.push(result.typeDefs);
                        templateTypes.push(result.fieldType);
                    });

                    typeDefs.push(`union ${unionTypeName} = ${templateTypes.join(" | ")}`);

                    return {
                        fields: `${field.fieldId}: ${
                            field.multipleValues ? `[${unionTypeName}!]` : unionTypeName
                        }`,
                        typeDefs: typeDefs.join("\n")
                    };
                },
                /**
                 * TS is complaining about mixed types for createResolver.
                 * TODO @ts-refactor @pavel Maybe we should have a single createResolver method?
                 */
                // @ts-ignore
                createResolver(params) {
                    const { field } = params;
                    // Create a map of template types
                    const templates = getFieldTemplates(field);

                    return async (parent, _, context: CmsContext) => {
                        const { cms } = context;

                        if (field.multipleValues) {
                            // TODO: append __typename to each value
                            // return appendTypename(entries, modelIdToTypeName.get(modelId));
                        }

                        return {
                            // ...value
                            __typename: "TODO"
                        };
                    };
                }
            },
            manage: {
                createTypeField({ field }) {
                    if (field.multipleValues) {
                        return `${field.fieldId}: [JSON!]`;
                    }
                    return `${field.fieldId}: JSON`;
                },
                createInputField({ field }) {
                    return `${field.fieldId}: JSON`;
                }
            }
        };
    };
