import gql from "graphql-tag";
import {
    CmsContentEntryStatusType,
    CmsIdentity,
    CmsErrorResponse,
    CmsMetaResponse,
    CmsModel
} from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { CmsEntryGetEntryVariable } from "~/admin/plugins/fieldRenderers/ref/components/graphql";

const fields = `
    data {
        id
        entryId
        title
        description
        image
        status
        createdOn
        savedOn
        model {
            name
            modelId
        }
        createdBy {
            id
            displayName
            type
        }
        modifiedBy {
            id
            displayName
            type
        }
        published {
            id
        }
        wbyAco_location {
            folderId
        }
    }
    error {
        message
        code
        data
    }
`;

export interface ListLatestCmsEntriesResponse {
    entries: {
        data: CmsReferenceContentEntry[];
        error: CmsErrorResponse | null;
    };
}

export interface ListLatestCmsEntriesVariables {
    entries: CmsEntryGetEntryVariable[];
}

export const LIST_LATEST_CONTENT_ENTRIES = gql`
    query CmsListLatestContentEntries($entries: [CmsModelEntryInput!]!) {
        entries: getLatestContentEntries(entries: $entries) {
            ${fields}
        }
    }
`;

export interface SearchQueryResponseEntry {
    id: string;
    entryId: string;
    savedOn: Date;
    createdOn: Date;
    createdBy: CmsIdentity;
    ownedBy: CmsIdentity;
    modifiedBy: CmsIdentity;
    meta: {
        title: string;
        description?: string;
        image?: string;
        status: CmsContentEntryStatusType;
    };
    wbyAco_location?: {
        folderId?: string;
    };
}

export interface SearchQueryResponse {
    content: {
        data: SearchQueryResponseEntry[];
        error: CmsErrorResponse | null;
        meta: CmsMetaResponse;
    };
}

export interface SearchQueryVariables {
    where?: {
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
}

export const createSearchQuery = (model: CmsModel) => {
    return gql`
        query Search${model.pluralApiName}($where: ${model.singularApiName}ListWhereInput, $sort: [${model.singularApiName}ListSorter], $limit: Int, $after: String) {
            content: list${model.pluralApiName}(
            where: $where
            sort: $sort
            limit: $limit
            after: $after
            ) {
            data {
                id
                entryId
                savedOn
                createdOn
                revisionCreatedBy {
                    id
                    type
                    displayName
                }
                createdBy {
                    id
                    type
                    displayName
                }
                modifiedBy {
                    id
                    type
                    displayName
                }
                meta {
                    title
                    description
                    image
                    status
                }
                wbyAco_location {
                    folderId
                }
            }
            meta {
                cursor
                hasMoreItems
                totalCount
            }
            error {
                message
                code
                data
            }
        }
        }`;
};
