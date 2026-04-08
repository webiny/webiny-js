import type { ApiEndpoint, CmsModel, CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants.js";
import type {
    CmsModelFieldToGraphQL,
    CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

interface RenderListFilterFieldsParams {
    model: CmsModel;
    fields: CmsModelField[];
    type: ApiEndpoint;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    excludeFields?: string[];
}

interface RenderListFilterFieldsResponse {
    baseFilters: string[];
    baseFiltersAsString(): string;
    fieldFilters: string[];
    fieldFiltersAsString(): string;
    allFiltersAsString(): string;
}

interface RenderListFilterFields {
    (params: RenderListFilterFieldsParams): RenderListFilterFieldsResponse;
}

type CreateListFiltersType = CmsModelFieldToGraphQL.ReadApi["createListFilters"];

export const renderListFilterFields: RenderListFilterFields = (
    params
): RenderListFilterFieldsResponse => {
    const { model, fields, type, fieldRegistry, excludeFields = [] } = params;
    const baseFilters: string[] = [
        "id: ID",
        "id_not: ID",
        "id_in: [ID!]",
        "id_not_in: [ID!]",
        ...(excludeFields.includes("entryId")
            ? []
            : [
                  "entryId: String",
                  "entryId_not: String",
                  "entryId_in: [String!]",
                  "entryId_not_in: [String!]"
              ]),

        ...ENTRY_META_FIELDS.map(field => {
            if (isDateTimeEntryMetaField(field)) {
                return [
                    `${field}: DateTime`,
                    `${field}_gt: DateTime`,
                    `${field}_gte: DateTime`,
                    `${field}_lt: DateTime`,
                    `${field}_lte: DateTime`,
                    `${field}_between: [DateTime!]`,
                    `${field}_not_between: [DateTime!]`
                ];
            }

            return [
                `${field}: ID`,
                `${field}_not: ID`,
                `${field}_in: [ID!]`,
                `${field}_not_in: [ID!]`
            ];
        })
            .flat()
            .filter(field => {
                return !excludeFields.some(excl => {
                    return field.startsWith(`${excl}_`) || field.startsWith(`${excl}: `);
                });
            })
    ];
    /**
     * We can find different statuses only in the manage API endpoint.
     */
    if (type === "manage" && excludeFields.includes("status") === false) {
        baseFilters.push(
            "status: String",
            "status_not: String",
            "status_in: [String!]",
            "status_not_in: [String!]"
        );
    }

    const fieldFilters: string[] = [];

    for (const field of fields) {
        // Every time a client updates content model's fields, we check the type of each field. If a field plugin
        // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
        // want to be careful when accessing the field plugin here too. It is still possible to have a content model
        // that contains a field, for which we don't have a plugin registered on the backend. For example, user
        // could've just removed the plugin from the backend.
        const baseType = getBaseFieldType(field);
        const fieldImpl = fieldRegistry.get(baseType);
        const api = fieldImpl ? (type === "manage" ? fieldImpl.manage : fieldImpl.read) : undefined;
        const createListFilters: CreateListFiltersType | undefined = api?.createListFilters;
        if (typeof createListFilters !== "function") {
            continue;
        }
        fieldFilters.push(createListFilters({ model, field, fieldRegistry }));
    }

    return {
        baseFilters,
        fieldFilters,
        baseFiltersAsString() {
            return baseFilters.join("\n");
        },
        fieldFiltersAsString() {
            return fieldFilters.join("\n");
        },
        allFiltersAsString() {
            return [...baseFilters, ...fieldFilters].join("\n");
        }
    };
};
