import gql from "graphql-tag";
import {
    CmsContentEntryRevision,
    CmsEditorContentEntry,
    CmsEditorContentModel,
    CmsErrorResponse,
    CmsMetaResponse
} from "~/types";
import { createFieldsList } from "./createFieldsList";
import { getModelTitleFieldId } from "~/utils/getModelTitleFieldId";

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

const CONTENT_META_FIELDS = /* GraphQL */ `
    title
    publishedOn
    version
    locked
    status
`;

/**
 * ############################################
 * Get CMS Entry Query
 */
export interface CmsEntryGetQueryResponse {
    content: {
        data: CmsEditorContentEntry;
        error: CmsErrorResponse | null;
    };
}

export interface CmsEntryGetQueryVariables {
    revision?: string;
    entryId?: string;
}

export const createReadQuery = (model: CmsEditorContentModel) => {
    /**
     * This query now accepts both revision or entryId as we can load exact revision or latest (if entryId was sent).
     */
    return gql`
        query CmsEntriesGet${model.singularApiName}($revision: ID, $entryId: ID) {
            content: get${model.singularApiName}(revision: $revision, entryId: $entryId) {
            data {
                id
                createdBy {
                    id
                }
                ${createFieldsList({ model, fields: model.fields })}
                savedOn
                meta {
                    ${CONTENT_META_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
        }
    `;
};

/**
 * ############################################
 * List CMS Entry Revisions Query
 */
export interface CmsEntriesListRevisionsQueryResponse {
    revisions: {
        data: CmsContentEntryRevision[];
        error: CmsErrorResponse | null;
        meta: CmsMetaResponse;
    };
}

export interface CmsEntriesListRevisionsQueryVariables {
    id: string;
}

export const createRevisionsQuery = (model: CmsEditorContentModel) => {
    return gql`
        query CmsEntriesGet${model.singularApiName}Revisions($id: ID!) {
        revisions: get${model.singularApiName}Revisions(id: $id) {
        data {
        id
        savedOn
        meta {
        ${CONTENT_META_FIELDS}
        }
        }
        error ${ERROR_FIELD}
        }
        }
    `;
};

/**
 * ############################################
 * List CMS Entries Query
 */
export interface CmsEntriesListQueryResponse {
    content: {
        data: CmsEditorContentEntry[];
        error: CmsErrorResponse | null;
        meta: CmsMetaResponse;
    };
}

export interface CmsEntriesListQueryVariables {
    // TODO @ts-refactor better list types
    where?: {
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
}

export const createListQuery = (model: CmsEditorContentModel) => {
    return gql`
        query CmsEntriesList${model.pluralApiName}($where: ${
        model.singularApiName
    }ListWhereInput, $sort: [${model.singularApiName}ListSorter], $limit: Int, $after: String) {
            content: list${model.pluralApiName}(
            where: $where
            sort: $sort
            limit: $limit
            after: $after
            ) {
            data {
                id
                savedOn
                meta {
                    ${CONTENT_META_FIELDS}
                }
                ${getModelTitleFieldId(model)}
            }
            meta {
                cursor
                hasMoreItems
                totalCount
            }
            error ${ERROR_FIELD}
        }
        }
    `;
};

/**
 * ############################################
 * Delete Mutation
 */
export interface CmsEntryDeleteMutationResponse {
    content: {
        data: CmsEditorContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

export interface CmsEntryDeleteMutationVariables {
    revision: string;
}

export const createDeleteMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsEntriesDelete${model.singularApiName}($revision: ID!) {
            content: delete${model.singularApiName}(revision: $revision) {
            data
            error ${ERROR_FIELD}
        }
        }
    `;
};

/**
 * ############################################
 * Create Mutation
 */
export interface CmsEntryCreateMutationResponse {
    content: {
        data: CmsEditorContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

export interface CmsEntryCreateMutationVariables {
    /**
     * We have any here because we do not know which fields does entry have
     */
    data: Record<string, any>;
}

export const createCreateMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsEntriesCreate${model.singularApiName}($data: ${model.singularApiName}Input!) {
            content: create${model.singularApiName}(data: $data) {
            data {
                id
                savedOn
                ${createFieldsList({ model, fields: model.fields })}
                meta {
                    ${CONTENT_META_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
        }
    `;
};

/**
 * ############################################
 * Create From Mutation
 */
export interface CmsEntryCreateFromMutationResponse {
    content: {
        data?: CmsEditorContentEntry;
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryCreateFromMutationVariables {
    revision: string;
    /**
     * We have any here because we do not know which fields does entry have
     */
    data?: Record<string, any>;
}

export const createCreateFromMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsCreate${model.singularApiName}From($revision: ID!, $data: ${
        model.singularApiName
    }Input) {
        content: create${model.singularApiName}From(revision: $revision, data: $data) {
        data {
        id
        savedOn
        ${createFieldsList({ model, fields: model.fields })}
        meta {
        ${CONTENT_META_FIELDS}
        }
        }
        error ${ERROR_FIELD}
        }
        }`;
};

/**
 * ############################################
 * Update Mutation
 */
export interface CmsEntryUpdateMutationResponse {
    content: {
        data?: CmsEditorContentEntry;
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryUpdateMutationVariables {
    revision: string;
    /**
     * We have any here because we do not know which fields does entry have
     */
    data: Record<string, any>;
}

export const createUpdateMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsUpdate${model.singularApiName}($revision: ID!, $data: ${
        model.singularApiName
    }Input!) {
            content: update${model.singularApiName}(revision: $revision, data: $data) {
            data {
                id
                ${createFieldsList({ model, fields: model.fields })}
                savedOn
                meta {
                    ${CONTENT_META_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
        }
    `;
};

/**
 * ############################################
 * Publish Mutation
 */
export interface CmsEntryPublishMutationResponse {
    content: {
        data?: CmsEditorContentEntry;
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryPublishMutationVariables {
    revision: string;
}

export const createPublishMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsPublish${model.singularApiName}($revision: ID!) {
            content: publish${model.singularApiName}(revision: $revision) {
            data {
                id
                meta {
                    ${CONTENT_META_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
        }`;
};

/**
 * ############################################
 * Unpublish Mutation
 */
export interface CmsEntryUnpublishMutationResponse {
    content: {
        data?: CmsEditorContentEntry;
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryUnpublishMutationVariables {
    revision: string;
}

export const createUnpublishMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsUnpublish${model.singularApiName}($revision: ID!) {
            content: unpublish${model.singularApiName}(revision: $revision) {
            data {
                id
                meta {
                    ${CONTENT_META_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
        }`;
};
