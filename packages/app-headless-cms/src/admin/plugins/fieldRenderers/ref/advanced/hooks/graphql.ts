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
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";

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
    const ucFirstPluralizedModelId = upperFirst(pluralize(model.modelId));
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query Search${ucFirstPluralizedModelId}($where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $limit: Int, $after: String) {
            content: list${ucFirstPluralizedModelId}(
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
                createdBy {
                    id
                    type
                    displayName
                }
                ownedBy {
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
