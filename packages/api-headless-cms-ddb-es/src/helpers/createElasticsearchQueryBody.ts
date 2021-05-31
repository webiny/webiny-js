import WebinyError from "@webiny/error";
import { operatorPluginsList } from "./operatorPluginsList";
import { transformValueForSearch } from "./transformValueForSearch";
import { searchPluginsList } from "./searchPluginsList";
import {
    CmsContentEntryListArgs,
    CmsContentEntryListSort,
    CmsContentEntryListWhere,
    CmsContentModel,
    CmsContentModelField,
    CmsContext,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import { CmsModelFieldToElasticsearchPlugin, ElasticsearchQueryPlugin } from "../types";
import { decodeElasticsearchCursor } from "../utils";
import {
    TYPE_ENTRY_LATEST,
    TYPE_ENTRY_PUBLISHED
} from "../operations/entry/CmsContentEntryDynamoElastic";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

type ModelFieldPath = string | ((value: string) => string);
interface ModelField {
    unmappedType?: string;
    isSearchable: boolean;
    isSortable: boolean;
    type: string;
    isSystemField?: boolean;
    field: CmsContentModelField;
    path?: ModelFieldPath;
}

type ModelFields = Record<string, ModelField>;

type UnmappedFieldTypes = {
    [type: string]: (field: CmsContentModelField) => string | undefined;
};

interface FieldTypePlugin {
    unmappedType?: (field: CmsContentModelField) => string | undefined;
    isSearchable: boolean;
    isSortable: boolean;
}
type FieldTypePlugins = Record<string, FieldTypePlugin>;

interface CreateElasticsearchParams {
    context: CmsContext;
    model: CmsContentModel;
    args: CmsContentEntryListArgs;
    parentObject?: string;
}

interface CreateElasticsearchSortParams {
    sort: CmsContentEntryListSort;
    modelFields: ModelFields;
    parentObject?: string;
    model: CmsContentModel;
}

interface CreateElasticsearchQueryArgs {
    model: CmsContentModel;
    context: CmsContext;
    where: CmsContentEntryListWhere;
    modelFields: ModelFields;
    parentObject?: string;
}

interface ElasticsearchSortParam {
    order: string;
}

type ElasticsearchSortFields = Record<string, ElasticsearchSortParam>;

const parseWhereKeyRegExp = new RegExp(/^([a-zA-Z0-9]+)(_[a-zA-Z0-9_]+)?$/);

const parseWhereKey = (key: string) => {
    const match = key.match(parseWhereKeyRegExp);

    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }

    const [, field, operation = "eq"] = match;
    const op = operation.match(/^_/) ? operation.substr(1) : operation;

    if (!field.match(/^([a-zA-Z]+)$/)) {
        throw new Error(`Cannot filter by "${field}".`);
    }

    return { field, op };
};

const sortRegExp = new RegExp(/^([a-zA-Z-0-9_]+)_(ASC|DESC)$/);

const createElasticsearchSortParams = (
    args: CreateElasticsearchSortParams
): ElasticsearchSortFields[] => {
    const { sort, modelFields, parentObject } = args;

    if (!sort) {
        return undefined;
    }

    const withParentObject = (field: string) => {
        if (!parentObject) {
            return null;
        }
        return `${parentObject}.${field}`;
    };

    return sort.map(value => {
        const match = value.match(sortRegExp);

        if (!match) {
            throw new WebinyError(`Cannot sort by "${value}".`);
        }

        const [, field, order] = match;
        const modelFieldOptions = modelFields[field] || (({} as unknown) as ModelField);
        const { isSortable = false, unmappedType, isSystemField = false } = modelFieldOptions;

        if (!isSortable) {
            throw new WebinyError(`Field is not sortable.`, "FIELD_NOT_SORTABLE", {
                field
            });
        }

        const name = isSystemField ? field : withParentObject(field);

        const fieldName = unmappedType ? name : `${name}.keyword`;
        return {
            [fieldName]: {
                order: order.toLowerCase() === "asc" ? "asc" : "desc",
                // eslint-disable-next-line
                unmapped_type: unmappedType
            }
        };
    });
};
/**
 * Latest and published are specific in Elasticsearch to that extend that they are tagged in the __type property.
 * We allow either published or either latest.
 * Latest is used in the manage API and published in the read API.
 */
const createInitialQueryValue = (args: CreateElasticsearchQueryArgs): ElasticsearchQuery => {
    const { where, context } = args;

    const query: ElasticsearchQuery = {
        must: [],
        mustNot: [],
        should: [],
        filter: []
    };

    // When ES index is shared between tenants, we need to filter records by tenant ID
    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
    if (sharedIndex) {
        const tenant = context.security.getTenant();
        query.must.push({ term: { "tenant.keyword": tenant.id } });
    }
    /**
     * We must transform published and latest where args into something that is understandable by our Elasticsearch
     */
    if (where.published === true) {
        query.must.push({
            term: {
                "__type.keyword": TYPE_ENTRY_PUBLISHED
            }
        });
    } else if (where.latest === true) {
        query.must.push({
            term: {
                "__type.keyword": TYPE_ENTRY_LATEST
            }
        });
    }
    // we do not allow not published and not latest
    else if (where.published === false) {
        throw new WebinyError(
            `Cannot call Elasticsearch query with "published" set at false.`,
            "ELASTICSEARCH_UNSUPPORTED_QUERY",
            {
                where
            }
        );
    } else if (where.latest === false) {
        throw new WebinyError(
            `Cannot call Elasticsearch query with "latest" set at false.`,
            "ELASTICSEARCH_UNSUPPORTED_QUERY",
            {
                where
            }
        );
    }
    //
    return query;
};

const specialFields = ["published", "latest"];
/*
 * Iterate through where keys and apply plugins where necessary
 */
const execElasticsearchBuildQueryPlugins = (
    args: CreateElasticsearchQueryArgs
): ElasticsearchQuery => {
    const { where, modelFields, parentObject, context } = args;
    const query = createInitialQueryValue(args);

    // always remove special fields
    // these do not exist in elasticsearch
    for (const sf of specialFields) {
        delete where[sf];
    }

    const withParentObject = (field: string) => {
        if (!parentObject) {
            return null;
        }
        return `${parentObject}.${field}`;
    };

    if (!where || Object.keys(where).length === 0) {
        return query;
    }

    const operatorPlugins = operatorPluginsList(context);
    const searchPlugins = searchPluginsList(context);

    for (const key in where) {
        /**
         * We do not need to go further if value is undefined.
         * There are few hardcoded possibilities when value is undefined, for example, ownedBy.
         */
        if (where[key] === undefined) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        const modelField = modelFields[field];
        const { isSearchable = false, isSystemField, field: cmsField } = modelField || {};

        if (!modelField) {
            throw new WebinyError(`There is no field "${field}".`);
        } else if (!isSearchable) {
            throw new WebinyError(`Field "${field}" is not searchable.`);
        }
        const plugin = operatorPlugins[op];
        if (!plugin) {
            throw new WebinyError("Operator plugin missing.", "PLUGIN_MISSING", {
                operator: op
            });
        }
        const fieldSearchPlugin = searchPlugins[modelField.type];
        const value = transformValueForSearch({
            plugins: searchPlugins,
            field: cmsField,
            value: where[key],
            context
        });
        /**
         * A possibility to build field custom path for the Elasticsearch record.
         */
        const customFieldPath =
            fieldSearchPlugin && typeof fieldSearchPlugin.createPath === "function"
                ? fieldSearchPlugin.createPath({
                      field: modelField.field,
                      context
                  })
                : modelField.path || null;
        const fieldWithParent = isSystemField
            ? customFieldPath
            : customFieldPath || withParentObject(field);
        plugin.apply(query, {
            field: fieldWithParent || field,
            value,
            parentObject,
            originalField: fieldWithParent ? field : undefined,
            context
        });
    }

    return query;
};

const createSystemField = (field: Partial<CmsContentModelField>): CmsContentModelField => {
    if (!field.fieldId) {
        throw new WebinyError(
            `When creating system field it must have a "entryId".`,
            "SYSTEM_FIELD_ERROR",
            {
                field
            }
        );
    } else if (!field.type) {
        throw new WebinyError(
            `When creating system field it must have a "type".`,
            "SYSTEM_FIELD_ERROR",
            {
                field
            }
        );
    }
    return (field as unknown) as CmsContentModelField;
};
/*
 * Create an object with key fieldType and options for that field
 */
const createModelFieldOptions = (context: CmsContext, model: CmsContentModel): ModelFields => {
    const systemFields: ModelFields = {
        id: {
            type: "text",
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
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
                fieldId: "entryId",
                type: "text"
            })
        },
        savedOn: {
            type: "date",
            unmappedType: "date",
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
                fieldId: "savedOn",
                type: "date",
                settings: {
                    type: "dateTimeWithoutTimezone"
                }
            })
        },
        createdOn: {
            type: "date",
            unmappedType: "date",
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
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
                fieldId: "ownedBy",
                type: "text"
            })
        },
        version: {
            type: "number",
            unmappedType: undefined,
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: createSystemField({
                fieldId: "version",
                type: "number"
            })
        }
    };
    // collect all unmappedType from elastic plugins
    const unmappedTypes: UnmappedFieldTypes = context.plugins
        .byType<CmsModelFieldToElasticsearchPlugin>("cms-model-field-to-elastic-search")
        .reduce((acc, plugin) => {
            if (!plugin.unmappedType) {
                return acc;
            }
            acc[plugin.fieldType] = plugin.unmappedType;
            return acc;
        }, {});
    // collect all field types from the plugins
    const fieldTypePlugins: FieldTypePlugins = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((types, plugin) => {
            const { fieldType, isSearchable, isSortable } = plugin;
            types[fieldType] = {
                unmappedType: unmappedTypes[fieldType],
                isSearchable: isSearchable === true,
                isSortable: isSortable === true
            };
            return types;
        }, {});

    return model.fields.reduce((fields, field) => {
        const { fieldId, type } = field;
        if (!fieldTypePlugins[type]) {
            throw new WebinyError(`There is no plugin for field type "${type}".`);
        }
        const { isSearchable, isSortable, unmappedType } = fieldTypePlugins[type];
        fields[fieldId] = {
            type,
            isSearchable,
            isSortable,
            unmappedType: typeof unmappedType === "function" ? unmappedType(field) : undefined,
            isSystemField: false,
            field
        };

        return fields;
    }, systemFields);
};

export const createElasticsearchQueryBody = (params: CreateElasticsearchParams) => {
    const { context, model, args, parentObject = null } = params;
    const { where, after, limit, sort } = args;

    const modelFields = createModelFieldOptions(context, model);

    const query = execElasticsearchBuildQueryPlugins({
        model,
        context,
        where,
        modelFields,
        parentObject
    });

    const queryPlugins = context.plugins.byType<ElasticsearchQueryPlugin>(
        "cms-elasticsearch-query"
    );
    for (const pl of queryPlugins) {
        pl.modify({ query, model, context });
    }

    return {
        query: {
            bool: {
                must: query.must.length > 0 ? query.must : undefined,
                must_not: query.mustNot.length > 0 ? query.mustNot : undefined,
                should: query.should.length > 0 ? query.should : undefined,
                filter: query.filter.length > 0 ? query.filter : undefined
            }
        },
        sort: createElasticsearchSortParams({ sort, modelFields, parentObject, model }),
        size: limit + 1,
        // eslint-disable-next-line
        search_after: decodeElasticsearchCursor(after) || undefined,
        // eslint-disable-next-line
        track_total_hits: true
    };
};
