import WebinyError from "@webiny/error";
import { transformValueForSearch } from "./transformValueForSearch";
import { searchPluginsList } from "./searchPluginsList";
import {
    CmsEntryListParams,
    CmsEntryListSort,
    CmsEntryListWhere,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import {
    SearchBody as esSearchBody,
    Sort as esSort,
    ElasticsearchBoolQueryConfig
} from "@webiny/api-elasticsearch/types";
import { decodeCursor } from "@webiny/api-elasticsearch/cursors";
import { createSort } from "@webiny/api-elasticsearch/sort";
import { createModelFields, ModelField, ModelFields } from "./fields";
import { CmsEntryElasticsearchFieldPlugin } from "~/plugins/CmsEntryElasticsearchFieldPlugin";
import { parseWhereKey } from "@webiny/api-elasticsearch/where";
import { PluginsContainer } from "@webiny/plugins";
import { createLatestType, createPublishedType } from "~/operations/entry";
import { CmsEntryElasticsearchQueryModifierPlugin } from "~/plugins/CmsEntryElasticsearchQueryModifierPlugin";
import { CmsEntryElasticsearchSortModifierPlugin } from "~/plugins/CmsEntryElasticsearchSortModifierPlugin";
import { CmsEntryElasticsearchBodyModifierPlugin } from "~/plugins/CmsEntryElasticsearchBodyModifierPlugin";
import {
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    CreatePathCallableParams
} from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";
import { getElasticsearchOperatorPluginsByLocale } from "@webiny/api-elasticsearch/operators";
import { normalizeValue } from "@webiny/api-elasticsearch/normalize";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";

interface CreateElasticsearchParams {
    plugins: PluginsContainer;
    model: CmsModel;
    args: CmsEntryListParams;
    parentPath?: string;
}

interface CreateElasticsearchSortParams {
    plugins: PluginsContainer;
    sort?: CmsEntryListSort;
    modelFields: ModelFields;
    parentPath?: string | null;
    model: CmsModel;
    searchPlugins: Record<string, CmsEntryElasticsearchQueryBuilderValueSearchPlugin>;
}

interface CreateElasticsearchQueryArgs {
    model: CmsModel;
    plugins: PluginsContainer;
    where: CmsEntryListWhere;
    modelFields: ModelFields;
    parentPath?: string | null;
    searchPlugins: Record<string, CmsEntryElasticsearchQueryBuilderValueSearchPlugin>;
    fullTextSearch: {
        term?: string;
        fields: string[];
    };
}

const specialFields: (keyof Partial<CmsEntryListWhere>)[] = ["published", "latest"];
const noKeywordFields = ["date", "number", "boolean"];

const createElasticsearchSortParams = (args: CreateElasticsearchSortParams): esSort => {
    const { sort, modelFields, parentPath, searchPlugins } = args;

    if (!sort || sort.length === 0) {
        return [];
    }

    const sortPlugins = Object.values(modelFields).reduce((plugins, modelField) => {
        const searchPlugin = searchPlugins[modelField.type];

        plugins[modelField.field.fieldId] = new CmsEntryElasticsearchFieldPlugin({
            unmappedType: modelField.unmappedType,
            keyword: hasKeyword(modelField),
            sortable: modelField.isSortable,
            searchable: modelField.isSearchable,
            field: modelField.field.fieldId,
            path: createFieldPath({
                key: modelField.field.fieldId,
                parentPath,
                modelField,
                searchPlugin
            })
        });
        return plugins;
    }, {} as Record<string, CmsEntryElasticsearchFieldPlugin>);

    return createSort({
        fieldPlugins: sortPlugins,
        sort
    });
};
/**
 * Latest and published are specific in Elasticsearch to that extend that they are tagged in the __type property.
 * We allow either published or either latest.
 * Latest is used in the manage API and published in the read API.
 */
const createInitialQueryValue = (
    params: CreateElasticsearchQueryArgs
): ElasticsearchBoolQueryConfig => {
    const { model, where: initialWhere } = params;
    /**
     * Cast as partial so we can remove unnecessary keys.
     */
    const where: CmsEntryListWhere = {
        ...initialWhere
    };

    const query: ElasticsearchBoolQueryConfig = {
        must: [],
        must_not: [],
        should: [],
        filter: []
    };

    // When ES index is shared between tenants, we need to filter records by tenant ID
    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
    if (sharedIndex) {
        query.must.push({ term: { "tenant.keyword": model.tenant } });
    }

    query.must.push({
        term: {
            "locale.keyword": model.locale
        }
    });

    /**
     * We must transform published and latest where args into something that is understandable by our Elasticsearch
     */
    if (where.published === true) {
        query.must.push({
            term: {
                "__type.keyword": createPublishedType()
            }
        });
    } else if (where.latest === true) {
        query.must.push({
            term: {
                "__type.keyword": createLatestType()
            }
        });
    }
    // we do not allow not published and not latest
    else {
        throw new WebinyError(
            `Cannot call Elasticsearch query when not setting "published" or "latest".`,
            "ELASTICSEARCH_UNSUPPORTED_QUERY",
            {
                where
            }
        );
    }
    //
    return query;
};

interface CreateFieldPathParams {
    modelField: ModelField;
    key: string;
    searchPlugin?: CmsEntryElasticsearchQueryBuilderValueSearchPlugin;
    parentPath?: string | null;
}
const createFieldPath = ({
    modelField,
    searchPlugin,
    parentPath,
    key
}: CreateFieldPathParams): string => {
    let path: string | null = null;
    if (searchPlugin && typeof searchPlugin.createPath === "function") {
        path = searchPlugin.createPath({
            field: modelField.field,
            value: null,
            key
        });
    } else if (typeof modelField.path === "function") {
        path = modelField.path(modelField.field.fieldId);
    }
    if (!path) {
        /**
         * We know that modelFieldPath is a string or undefined at this point.
         */
        path = (modelField.path as string) || modelField.field.fieldId || modelField.field.id;
    }
    return modelField.isSystemField || !parentPath || path.match(parentPath)
        ? path
        : `${parentPath}.${path}`;
};

const hasKeyword = (modelField: ModelField): boolean => {
    /**
     * We defined some field types that MUST have no keyword added to the field path
     */
    if (noKeywordFields.includes(modelField.type)) {
        return false;
    } else if (modelField.unmappedType) {
        /**
         * If modelField has unmapped type defined, do not add keyword.
         */
        return false;
    } else if (modelField.keyword === false) {
        /**
         * And if specifically defined that modelField has no keyword, do not add it.
         */
        return false;
    }
    /**
     * All other fields have keyword added.
     */
    return true;
};

interface IsRefFieldFilteringParams {
    key: string;
    value: any;
    field: CmsModelField;
}

/**
 * A list of typeof strings that are 100% not ref field filtering.
 * We also need to check for array and date.
 */
const nonRefFieldTypes: string[] = [
    "string",
    "number",
    "undefined",
    "symbol",
    "bigint",
    "function",
    "boolean"
];
const isRefFieldFiltering = (params: IsRefFieldFilteringParams): boolean => {
    const { key, value, field } = params;
    const typeOf = typeof value;
    if (
        !value ||
        nonRefFieldTypes.includes(typeOf) ||
        Array.isArray(value) ||
        value instanceof Date ||
        !!value.toISOString
    ) {
        return false;
    } else if (typeOf === "object" && field.type === "ref") {
        return true;
    }
    throw new WebinyError(
        "Could not determine if the search value is ref field search.",
        "REF_FIELD_SEARCH_ERROR",
        {
            value,
            field,
            key
        }
    );
};

interface FieldPathFactoryParams extends Omit<CreatePathCallableParams, "field"> {
    plugin?: CmsEntryElasticsearchQueryBuilderValueSearchPlugin;
    modelField: ModelField;
    key: string;
    parentPath?: string | null;
    keyword?: boolean;
}
const fieldPathFactory = (params: FieldPathFactoryParams): string => {
    const { plugin, modelField, value, parentPath, keyword, key } = params;

    const field = modelField.field;

    let fieldPath: string | null = null;
    if (plugin) {
        fieldPath = plugin.createPath({ field, value, key });
    }
    if (!fieldPath) {
        fieldPath = field.fieldId;
        if (modelField.path) {
            fieldPath =
                typeof modelField.path === "function" ? modelField.path(value) : modelField.path;
        }
    }

    const keywordValue = keyword ? ".keyword" : "";
    if (!parentPath) {
        return `${fieldPath}${keywordValue}`;
    }
    return `${parentPath}.${fieldPath}${keywordValue}`;
};

interface ApplyFilteringParams {
    query: ElasticsearchBoolQueryConfig;
    modelField: ModelField;
    operator: string;
    key: string;
    value: any;
    operatorPlugins: Record<string, ElasticsearchQueryBuilderOperatorPlugin>;
    searchPlugins: Record<string, CmsEntryElasticsearchQueryBuilderValueSearchPlugin>;
    parentPath?: string | null;
}
const applyFiltering = (params: ApplyFilteringParams) => {
    const {
        query,
        modelField,
        operator,
        key,
        value: initialValue,
        operatorPlugins,
        searchPlugins,
        parentPath
    } = params;
    const plugin = operatorPlugins[operator];
    if (!plugin) {
        throw new WebinyError("Operator plugin missing.", "PLUGIN_MISSING", {
            operator
        });
    }
    const fieldSearchPlugin = searchPlugins[modelField.type];
    const value = transformValueForSearch({
        plugins: searchPlugins,
        field: modelField.field,
        value: initialValue
    });

    const keyword = hasKeyword(modelField);
    plugin.apply(query, {
        basePath: fieldPathFactory({
            plugin: fieldSearchPlugin,
            modelField,
            parentPath: modelField.isSystemField ? null : parentPath,
            value,
            key
        }),
        path: fieldPathFactory({
            plugin: fieldSearchPlugin,
            modelField,
            value,
            parentPath: modelField.isSystemField ? null : parentPath,
            keyword,
            key
        }),
        value,
        keyword
    });
};

interface ApplyFullTextSearchParams {
    query: ElasticsearchBoolQueryConfig;
    modelFields: ModelFields;
    term?: string;
    fields: string[];
}
const applyFullTextSearch = (params: ApplyFullTextSearchParams): void => {
    const { query, modelFields, term, fields } = params;
    if (!term || term.length === 0 || fields.length === 0) {
        return;
    }

    const fieldPaths = fields.reduce((collection, field) => {
        const modelField = modelFields[field];
        if (!modelField) {
            return collection;
        }

        collection.push(`values.${field}`);

        return collection;
    }, [] as string[]);

    query.must.push({
        query_string: {
            allow_leading_wildcard: true,
            fields: fieldPaths,
            query: normalizeValue(term),
            default_operator: "or"
        }
    });
};
/*
 * Iterate through where keys and apply plugins where necessary
 */
const execElasticsearchBuildQueryPlugins = (
    params: CreateElasticsearchQueryArgs
): ElasticsearchBoolQueryConfig => {
    const {
        model,
        where: initialWhere,
        modelFields,
        parentPath,
        plugins,
        searchPlugins,
        fullTextSearch
    } = params;

    const where: Partial<CmsEntryListWhere> = {
        ...initialWhere
    };
    const query = createInitialQueryValue({
        ...params,
        where
    });

    /**
     * Add full text search for requested fields.
     */
    applyFullTextSearch({
        query,
        modelFields,
        term: fullTextSearch.term,
        fields: fullTextSearch.fields
    });

    /**
     * Always remove special fields, as these do not exist in Elasticsearch.
     */
    for (const sf of specialFields) {
        delete where[sf];
    }

    if (Object.keys(where).length === 0) {
        return query;
    }

    const operatorPlugins = getElasticsearchOperatorPluginsByLocale(plugins, model.locale);

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        /**
         * We do not need to go further if value is undefined.
         * There are few hardcoded possibilities when value is undefined, for example, ownedBy.
         */
        // TODO figure out how to have type.
        const value = (where as any)[key];
        if (value === undefined) {
            continue;
        }
        const { field, operator } = parseWhereKey(key);
        const modelField = modelFields[field];

        if (!modelField) {
            throw new WebinyError(`There is no field "${field}".`);
        }
        const { isSearchable = false, field: cmsField } = modelField;
        if (!isSearchable) {
            throw new WebinyError(`Field "${field}" is not searchable.`);
        }
        /**
         * There is a possibility that value is an object.
         * In that case, check if field is ref field and continue a bit differently.
         */
        if (isRefFieldFiltering({ key, value, field: cmsField })) {
            /**
             * We we need to go through each key in where[key] to determine the filters.
             */
            for (const whereKey in value) {
                const { operator } = parseWhereKey(whereKey);
                applyFiltering({
                    query,
                    modelField,
                    operator,
                    key: whereKey,
                    value: value[whereKey],
                    searchPlugins,
                    operatorPlugins,
                    parentPath
                });
            }
            continue;
        }
        applyFiltering({
            query,
            modelField,
            operator,
            key,
            value,
            searchPlugins,
            operatorPlugins,
            parentPath
        });
    }

    return query;
};

export const createElasticsearchQueryBody = (params: CreateElasticsearchParams): esSearchBody => {
    const { plugins, model, args, parentPath = null } = params;
    const { where = {}, after, limit, sort: initialSort, search, fields } = args;

    const modelFields = createModelFields(plugins, model);
    const searchPlugins = searchPluginsList(plugins);

    const query = execElasticsearchBuildQueryPlugins({
        model,
        plugins,
        where,
        modelFields,
        parentPath,
        searchPlugins,
        fullTextSearch: {
            term: search,
            fields: fields || []
        }
    });

    const queryPlugins = plugins
        .byType<CmsEntryElasticsearchQueryModifierPlugin>(
            CmsEntryElasticsearchQueryModifierPlugin.type
        )
        .filter(pl => {
            return !pl.modelId || pl.modelId === model.modelId;
        });
    for (const pl of queryPlugins) {
        pl.modifyQuery({ query, model, where });
    }

    const sort = createElasticsearchSortParams({
        plugins,
        sort: initialSort,
        modelFields,
        parentPath,
        model,
        searchPlugins
    });

    const sortPlugins = plugins
        .byType<CmsEntryElasticsearchSortModifierPlugin>(
            CmsEntryElasticsearchSortModifierPlugin.type
        )
        .filter(pl => {
            return !pl.modelId || pl.modelId === model.modelId;
        });
    for (const pl of sortPlugins) {
        pl.modifySort({
            sort,
            model
        });
    }

    const body: esSearchBody = {
        query: {
            bool: {
                must: query.must.length > 0 ? query.must : undefined,
                must_not: query.must_not.length > 0 ? query.must_not : undefined,
                should: query.should.length > 0 ? query.should : undefined,
                filter: query.filter.length > 0 ? query.filter : undefined
            }
        },
        sort,
        size: (limit || 0) + 1,
        // eslint-disable-next-line
        search_after: decodeCursor(after) as any,
        // eslint-disable-next-line
        track_total_hits: true
    };

    const bodyPlugins = plugins
        .byType<CmsEntryElasticsearchBodyModifierPlugin>(
            CmsEntryElasticsearchBodyModifierPlugin.type
        )
        .filter(pl => {
            return !pl.modelId || pl.modelId === model.modelId;
        });
    for (const pl of bodyPlugins) {
        pl.modifyBody({
            body,
            model
        });
    }

    return body;
};
