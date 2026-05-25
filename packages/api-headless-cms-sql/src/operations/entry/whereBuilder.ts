import type { Knex } from "knex";
import type {
    CmsEntryListWhere,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types/index.js";
import type {
    ModelFields,
    IModelFieldParent
} from "~/features/sqlEntryFilter/abstractions/index.js";
import type { SqlOperatorRegistry } from "~/features/sqlOperator/abstractions/index.js";
import type { SqlEntryFilterRegistry } from "~/features/sqlEntryFilter/abstractions/index.js";
import { storagePathToColumnName } from "~/utils/columnName.js";
import { parseWhereKey } from "~/utils/parseWhereKey.js";
import { normalizeValue } from "~/features/sqlOperator/normalizeValue.js";

export { parseWhereKey };

/* System field name to column/type mapping. */
const SYSTEM_FIELD_MAP: Record<string, { columnName: string; type: string }> = {
    id: { columnName: "id", type: "text" },
    entryId: { columnName: "entryId", type: "text" },
    status: { columnName: "status", type: "text" },
    version: { columnName: "version", type: "number" },
    createdOn: { columnName: "createdOn", type: "datetime" },
    savedOn: { columnName: "savedOn", type: "datetime" },
    deletedOn: { columnName: "deletedOn", type: "datetime" },
    createdBy: { columnName: "createdBy_id", type: "text" },
    modifiedBy: { columnName: "modifiedBy_id", type: "text" },
    savedBy: { columnName: "savedBy_id", type: "text" },
    firstPublishedBy: { columnName: "firstPublishedBy_id", type: "text" },
    lastPublishedBy: { columnName: "lastPublishedBy_id", type: "text" },
    revisionCreatedBy: { columnName: "revisionCreatedBy_id", type: "text" },
    revisionModifiedBy: { columnName: "revisionModifiedBy_id", type: "text" },
    revisionSavedBy: { columnName: "revisionSavedBy_id", type: "text" },
    revisionFirstPublishedBy: { columnName: "revisionFirstPublishedBy_id", type: "text" },
    revisionLastPublishedBy: { columnName: "revisionLastPublishedBy_id", type: "text" }
};

/* Builds value fields from model fields, recursively tracking parents. */
const buildValueFields = (
    fields: CmsModelField[],
    parentFieldIds: IModelFieldParent[],
    result: ModelFields
): void => {
    for (const field of fields) {
        const currentParents: IModelFieldParent[] = [
            ...parentFieldIds,
            { fieldId: field.fieldId, storageId: field.storageId }
        ];
        const fieldIdPath = [...parentFieldIds.map(p => p.fieldId), field.fieldId].join(".");

        if (field.type === "object" && field.settings?.fields) {
            /* Register the object field itself so ObjectFilter can find it. */
            result[fieldIdPath] = {
                fieldId: field.fieldId,
                storageId: field.storageId,
                type: field.type,
                columnName: "",
                searchable: true,
                sortable: false,
                parents: parentFieldIds
            };
            buildValueFields(field.settings.fields, currentParents, result);
            continue;
        }

        if (field.type === "dynamicZone" && field.settings?.templates) {
            for (const template of field.settings.templates) {
                if (template.fields) {
                    buildValueFields(template.fields, currentParents, result);
                }
            }
            continue;
        }

        /* Leaf field — compute column name from storageId path. */
        const storagePath = [...parentFieldIds.map(p => p.storageId), field.storageId];
        const columnName = storagePathToColumnName(storagePath);

        result[fieldIdPath] = {
            fieldId: field.fieldId,
            storageId: field.storageId,
            type: field.type,
            columnName,
            searchable: true,
            sortable: true,
            parents: parentFieldIds
        };
    }
};

/* Builds a ModelFields map from system fields + CMS model value fields. */
export const buildModelFields = (model: CmsModel): ModelFields => {
    const result: ModelFields = {};

    /* Register system fields. */
    for (const [fieldId, mapping] of Object.entries(SYSTEM_FIELD_MAP)) {
        result[fieldId] = {
            fieldId,
            storageId: fieldId,
            type: mapping.type,
            columnName: mapping.columnName,
            searchable: true,
            sortable: true,
            parents: []
        };
    }

    /* Register value fields from the model. */
    buildValueFields(model.fields, [], result);

    return result;
};

export interface IApplyWhereParams {
    query: Knex.QueryBuilder;
    where: CmsEntryListWhere;
    model: CmsModel;
    operatorRegistry: SqlOperatorRegistry.Interface;
    filterRegistry: SqlEntryFilterRegistry.Interface;
    fields: ModelFields;
}

/* Recursive function that walks CmsEntryListWhere and applies Knex conditions. */
export const applyWhere = (params: IApplyWhereParams): void => {
    const { query, where, operatorRegistry, filterRegistry, fields } = params;

    const applyFiltering = (filterParams: {
        query: Knex.QueryBuilder;
        column: string;
        operator: string;
        value: unknown;
    }): void => {
        operatorRegistry.get(filterParams.operator).apply({
            query: filterParams.query,
            column: filterParams.column,
            value: normalizeValue(filterParams.value)
        });
    };

    const getFilter = (type: string) => filterRegistry.get(type);

    const execWhere = (
        qb: Knex.QueryBuilder,
        conditions: Record<string, unknown>,
        isValues: boolean
    ): void => {
        for (const [key, value] of Object.entries(conditions)) {
            if (value === undefined) {
                continue;
            }

            /* Handle published flag. */
            if (key === "published") {
                qb.where("isPublished", value === true);
                continue;
            }

            /* Handle latest flag. */
            if (key === "latest") {
                qb.where("isLatest", value === true);
                continue;
            }

            /* Handle wbyDeleted. */
            if (key === "wbyDeleted") {
                qb.where("wbyDeleted", value as boolean);
                continue;
            }
            if (key === "wbyDeleted_not") {
                qb.where("wbyDeleted", !(value as boolean));
                continue;
            }

            /* Handle location / wbyAco_location. */
            if (key === "location" || key === "wbyAco_location") {
                const locationWhere = value as Record<string, unknown>;

                for (const [locKey, locValue] of Object.entries(locationWhere)) {
                    if (locValue === undefined) {
                        continue;
                    }

                    const parsed = parseWhereKey(locKey);
                    const column = `location_${parsed.fieldId}`;

                    operatorRegistry.get(parsed.operator).apply({
                        query: qb,
                        column,
                        value: locValue
                    });
                }
                continue;
            }

            /* Handle values — recurse into value fields. */
            if (key === "values") {
                execWhere(qb, value as Record<string, unknown>, true);
                continue;
            }

            /* Handle AND. */
            if (key === "AND") {
                const andConditions = value as CmsEntryListWhere[];

                qb.where(function (this: Knex.QueryBuilder) {
                    for (const condition of andConditions) {
                        this.andWhere(function (this: Knex.QueryBuilder) {
                            execWhere(this, condition as Record<string, unknown>, isValues);
                        });
                    }
                });
                continue;
            }

            /* Handle OR. */
            if (key === "OR") {
                const orConditions = value as CmsEntryListWhere[];

                qb.where(function (this: Knex.QueryBuilder) {
                    for (let i = 0; i < orConditions.length; i++) {
                        const condition = orConditions[i];

                        if (i === 0) {
                            this.where(function (this: Knex.QueryBuilder) {
                                execWhere(this, condition as Record<string, unknown>, isValues);
                            });
                        } else {
                            this.orWhere(function (this: Knex.QueryBuilder) {
                                execWhere(this, condition as Record<string, unknown>, isValues);
                            });
                        }
                    }
                });
                continue;
            }

            /* Regular field filter. */
            const parsed = parseWhereKey(key);
            const whereFieldId = parsed.fieldId;
            const field = fields[whereFieldId];

            if (!field) {
                continue;
            }

            const filter = filterRegistry.get(field.type);

            filter.exec({
                applyFiltering,
                getFilter,
                key,
                value,
                operator: parsed.operator,
                field,
                fields,
                query: qb
            });
        }
    };

    execWhere(query, where as Record<string, unknown>, false);
};

/* Applies a search term across specified fields using LIKE with OR. */
export const applySearch = (
    query: Knex.QueryBuilder,
    search: string | undefined,
    searchFields: string[],
    fields: ModelFields
): void => {
    if (!search || searchFields.length === 0) {
        return;
    }

    const validFields = searchFields.filter(id => {
        const f = fields[id];
        return f && f.searchable;
    });

    if (validFields.length === 0) {
        return;
    }

    const term = `%${search}%`;

    query.where(function (this: Knex.QueryBuilder) {
        let first = true;

        for (const fieldId of validFields) {
            const field = fields[fieldId];
            const column = field.columnName;

            if (first) {
                this.whereRaw("LOWER(??) LIKE LOWER(?)", [column, term]);
                first = false;
            } else {
                this.orWhereRaw("LOWER(??) LIKE LOWER(?)", [column, term]);
            }
        }
    });
};
