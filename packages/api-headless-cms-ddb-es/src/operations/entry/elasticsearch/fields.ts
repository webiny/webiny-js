import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { CmsModelFieldToElasticsearchPlugin } from "~/types";
import { ModelFields } from "./types";

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
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
                storageId: "id",
                fieldId: "id",
                type: "text"
            })
        },
        entryId: {
            type: "text",
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
                storageId: "entryId",
                fieldId: "entryId",
                type: "text"
            })
        },
        savedOn: {
            type: "date",
            unmappedType: "date",
            keyword: false,
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
                storageId: "savedOn",
                fieldId: "savedOn",
                type: "datetime",
                settings: {
                    type: "dateTimeWithoutTimezone"
                }
            })
        },
        createdOn: {
            type: "date",
            unmappedType: "date",
            keyword: false,
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
                storageId: "createdOn",
                fieldId: "createdOn",
                type: "text",
                settings: {
                    type: "dateTimeWithoutTimezone"
                }
            })
        },
        createdBy: {
            type: "text",
            unmappedType: undefined,
            isSystemField: true,
            isSearchable: true,
            isSortable: false,
            path: "createdBy.id",
            field: createSystemField({
                storageId: "createdBy",
                fieldId: "createdBy",
                type: "text"
            })
        },
        ownedBy: {
            type: "text",
            unmappedType: undefined,
            isSystemField: true,
            isSearchable: true,
            isSortable: false,
            path: "ownedBy.id",
            field: createSystemField({
                storageId: "ownedBy",
                fieldId: "ownedBy",
                type: "text"
            })
        },
        version: {
            type: "number",
            unmappedType: undefined,
            keyword: false,
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
                storageId: "version",
                fieldId: "version",
                type: "number"
            })
        },
        status: {
            type: "string",
            unmappedType: undefined,
            keyword: false,
            isSystemField: true,
            isSearchable: true,
            isSortable: false,
            field: createSystemField({
                storageId: "status",
                fieldId: "status",
                type: "string"
            })
        }
    };
};

interface UnmappedFieldTypes {
    [type: string]: (field: CmsModelField) => string | undefined;
}

interface FieldTypePlugin {
    unmappedType?: (field: CmsModelField) => string | undefined;
    isSearchable: boolean;
    isSortable: boolean;
    fullTextSearch?: boolean;
}
interface FieldTypePlugins {
    [key: string]: FieldTypePlugin;
}

interface BuildParams {
    plugins: FieldTypePlugins;
    fields: CmsModelField[];
    parents: string[];
}
const buildFieldsList = (params: BuildParams) => {
    const { plugins, fields, parents } = params;

    return fields.reduce<ModelFields>((result, field) => {
        const plugin = plugins[field.type];
        if (!plugin) {
            throw new WebinyError(`There is no plugin for field type "${field.type}".`);
        }

        const { isSearchable, isSortable, unmappedType, fullTextSearch } = plugin;

        const path = [...parents, field.fieldId].join(".");

        result[path] = {
            type: field.type,
            isSearchable,
            isSortable,
            fullTextSearch,
            unmappedType: typeof unmappedType === "function" ? unmappedType(field) : undefined,
            isSystemField: false,
            field
        };

        return result;
    }, {});
};

interface Params {
    plugins: PluginsContainer;
    fields?: CmsModelField[];
}
export const createModelFields = ({ plugins, fields }: Params) => {
    if (!fields || fields.length === 0) {
        return createSystemFields();
    }
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
            const { fieldType, isSearchable, isSortable, fullTextSearch } = plugin;
            types[fieldType] = {
                unmappedType: unmappedTypes[fieldType],
                isSearchable,
                isSortable,
                fullTextSearch
            };
            return types;
        }, {});

    return {
        ...createSystemFields(),
        ...buildFieldsList({
            fields,
            plugins: fieldTypePlugins,
            parents: []
        })
    };
};
