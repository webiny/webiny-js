import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import {
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import { CmsModelFieldToElasticsearchPlugin } from "~/types";
import { ModelFieldParent, ModelFields } from "./types";
import { CmsElasticsearchModelFieldPlugin } from "~/plugins";

type PartialCmsModelField = Partial<CmsModelField> &
    Pick<CmsModelField, "storageId" | "fieldId" | "type">;
const createSystemField = (field: PartialCmsModelField): CmsModelField => {
    return {
        ...field,
        id: field.fieldId,
        label: field.fieldId
    };
};

const createSystemFields = (): ModelFields => {
    return {
        id: {
            type: "text",
            systemField: true,
            searchable: true,
            sortable: true,
            field: createSystemField({
                storageId: "id",
                fieldId: "id",
                type: "text"
            }),
            parents: []
        },
        entryId: {
            type: "text",
            systemField: true,
            searchable: true,
            sortable: true,
            field: createSystemField({
                storageId: "entryId",
                fieldId: "entryId",
                type: "text"
            }),
            parents: []
        },
        savedOn: {
            type: "date",
            unmappedType: "date",
            keyword: false,
            systemField: true,
            searchable: true,
            sortable: true,
            field: createSystemField({
                storageId: "savedOn",
                fieldId: "savedOn",
                type: "datetime",
                settings: {
                    type: "dateTimeWithoutTimezone"
                }
            }),
            parents: []
        },
        createdOn: {
            type: "date",
            unmappedType: "date",
            keyword: false,
            systemField: true,
            searchable: true,
            sortable: true,
            field: createSystemField({
                storageId: "createdOn",
                fieldId: "createdOn",
                type: "text",
                settings: {
                    type: "dateTimeWithoutTimezone"
                }
            }),
            parents: []
        },
        createdBy: {
            type: "text",
            unmappedType: undefined,
            systemField: true,
            searchable: true,
            sortable: false,
            path: "createdBy.id",
            field: createSystemField({
                storageId: "createdBy",
                fieldId: "createdBy",
                type: "text"
            }),
            parents: []
        },
        ownedBy: {
            type: "text",
            unmappedType: undefined,
            systemField: true,
            searchable: true,
            sortable: false,
            path: "ownedBy.id",
            field: createSystemField({
                storageId: "ownedBy",
                fieldId: "ownedBy",
                type: "text"
            }),
            parents: []
        },
        version: {
            type: "number",
            unmappedType: undefined,
            keyword: false,
            systemField: true,
            searchable: true,
            sortable: true,
            field: createSystemField({
                storageId: "version",
                fieldId: "version",
                type: "number"
            }),
            parents: []
        },
        status: {
            type: "string",
            unmappedType: undefined,
            keyword: false,
            systemField: true,
            searchable: true,
            sortable: false,
            field: createSystemField({
                storageId: "status",
                fieldId: "status",
                type: "string"
            }),
            parents: []
        }
    };
};

interface UnmappedFieldTypes {
    [type: string]: (field: Pick<CmsModelField, "fieldId" | "type">) => string | undefined;
}

interface FieldTypePlugin {
    unmappedType?: (field: Pick<CmsModelField, "fieldId" | "type">) => string | undefined;
    searchable: boolean;
    sortable: boolean;
    fullTextSearch?: boolean;
}

interface FieldTypePlugins {
    [key: string]: FieldTypePlugin;
}

interface BuildCustomFieldsParams {
    fields: CmsElasticsearchModelFieldPlugin[];
    fieldTypePlugins: FieldTypePlugins;
}

const buildCustomFields = (params: BuildCustomFieldsParams) => {
    const { fields, fieldTypePlugins } = params;

    return fields.reduce<ModelFields>((collection, field) => {
        const typePlugin = fieldTypePlugins[field.fieldType];
        if (!typePlugin) {
            return collection;
        }
        let unmappedType: string | undefined = undefined;
        if (typePlugin.unmappedType) {
            unmappedType = typePlugin.unmappedType(field);
        }

        collection[field.fieldId] = {
            type: field.fieldType,
            field: createSystemField({
                storageId: field.fieldId,
                fieldId: field.fieldId,
                type: field.fieldType
            }),
            unmappedType,
            fullTextSearch: field.searchable ? typePlugin.fullTextSearch : false,
            searchable: field.searchable || typePlugin.searchable,
            sortable: field.sortable || typePlugin.sortable,
            systemField: false,
            path: field.path,
            parents: []
        };

        return collection;
    }, {});
};

interface BuildParams {
    plugins: FieldTypePlugins;
    fields: CmsModelField[];
    parents: ModelFieldParent[];
}

const buildFieldsList = (params: BuildParams): ModelFields => {
    const { plugins, fields, parents } = params;

    return fields.reduce<ModelFields>((result, field) => {
        const plugin = plugins[field.type];
        if (!plugin) {
            throw new WebinyError(`There is no plugin for field type "${field.type}".`);
        }

        const { searchable, sortable, unmappedType, fullTextSearch } = plugin;
        /**
         * If a field has child fields, go through them and add them to a result.
         */
        const childFields = field.settings?.fields || [];
        if (childFields.length > 0) {
            /**
             * Let's build all the child fields
             */
            const childResult = buildFieldsList({
                fields: childFields,
                plugins,
                parents: [
                    ...parents,
                    {
                        fieldId: field.fieldId,
                        storageId: field.storageId,
                        type: field.type
                    }
                ]
            });
            Object.assign(result, childResult);
        }

        const identifier = [...parents.map(p => p.fieldId), field.fieldId].join(".");

        result[identifier] = {
            type: field.type,
            parents,
            searchable,
            sortable,
            fullTextSearch,
            unmappedType: typeof unmappedType === "function" ? unmappedType(field) : undefined,
            systemField: false,
            field
        };

        return result;
    }, {});
};

interface Params {
    plugins: PluginsContainer;
    model: CmsModel;
}

export const createModelFields = ({ plugins, model }: Params) => {
    const fields = model.fields;
    const fieldDefinitionPlugins = plugins
        .byType<CmsElasticsearchModelFieldPlugin>(CmsElasticsearchModelFieldPlugin.type)
        .filter(plugin => {
            return plugin.canBeApplied(model.modelId);
        });
    /**
     * Collect all unmappedType from elastic plugins.
     */
    const unmappedTypes = plugins
        .byType<CmsModelFieldToElasticsearchPlugin>("cms-model-field-to-elastic-search")
        .reduce<UnmappedFieldTypes>((acc, plugin) => {
            if (!plugin.unmappedType) {
                return acc;
            }
            acc[plugin.fieldType] = plugin.unmappedType;
            return acc;
        }, {});
    /**
     * Collect all field types from the plugins.
     */
    const fieldTypePlugins = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce<FieldTypePlugins>((types, plugin) => {
            const { fieldType, fullTextSearch } = plugin;
            types[fieldType] = {
                unmappedType: unmappedTypes[fieldType],
                searchable: plugin.isSearchable,
                sortable: plugin.isSortable,
                fullTextSearch
            };
            return types;
        }, {});

    return {
        ...createSystemFields(),
        ...buildCustomFields({
            fields: fieldDefinitionPlugins,
            fieldTypePlugins
        }),
        ...buildFieldsList({
            fields,
            plugins: fieldTypePlugins,
            parents: []
        })
    };
};
