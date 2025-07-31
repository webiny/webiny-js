import type { CmsModel } from "~/types";

const identityFields = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;
const errorFields = `
    error {
        code
        message
        data
    }
`;

const authorWithSearchableJsonFields = `
    id
    entryId
    createdOn
    modifiedOn
    savedOn
    firstPublishedOn
    lastPublishedOn
    deletedOn
    restoredOn
    createdBy ${identityFields}
    modifiedBy ${identityFields}
    savedBy ${identityFields}
    deletedBy ${identityFields}
    restoredBy ${identityFields}
    meta {
        title
        modelId
        version
        locked
        status
       
        revisions {
            id
            name
            info
            meta {
                status
                version
            }
        }
        data
    }
    wbyAco_location {
        folderId
    }
    # user defined fields
    name
    info
    nonSearchableJson
`;

export const createGetQuery = (model: Pick<CmsModel, "singularApiName" | "pluralApiName">) => {
    return /* GraphQL */ `
        query Get${model.singularApiName}($revision: ID, $entryId: ID, $status: CmsEntryStatusType) {
            content: get${model.singularApiName}(revision: $revision, entryId: $entryId, status: $status) {
                data {
                    ${authorWithSearchableJsonFields}
                }
                ${errorFields}
            }
        }
    `;
};

export const createListQuery = (model: Pick<CmsModel, "singularApiName" | "pluralApiName">) => {
    return /* GraphQL */ `
        query List${model.pluralApiName}(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            content: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    ${authorWithSearchableJsonFields}
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                ${errorFields}
            }
        }
    `;
};
