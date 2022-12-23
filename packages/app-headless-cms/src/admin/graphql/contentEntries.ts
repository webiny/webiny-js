import upperFirst from "lodash/upperFirst";
import gql from "graphql-tag";
import pluralize from "pluralize";
import {
    CmsContentEntryRevision,
    CmsEditorContentEntry,
    CmsEditorContentModel,
    CmsErrorResponse,
    CmsMetaResponse
} from "~/types";
import { createFieldsList } from "./createFieldsList";

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
    const ucFirstModelId = upperFirst(model.modelId);
    /**
     * This query now accepts both revision or entryId as we can load exact revision or latest (if entryId was sent).
     */
    return gql`
        query CmsEntriesGet${ucFirstModelId}($revision: ID, $entryId: ID) {
            content: get${ucFirstModelId}(revision: $revision, entryId: $entryId) {
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsEntriesGet${ucFirstModelId}Revisions($id: ID!) {
            revisions: get${ucFirstModelId}Revisions(id: $id) {
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

const getModelTitleFieldId = (model: CmsEditorContentModel): string => {
    if (!model.titleFieldId || model.titleFieldId === "id") {
        return "";
    }
    return model.titleFieldId;
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
    const ucFirstPluralizedModelId = upperFirst(pluralize(model.modelId));
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsEntriesList${ucFirstPluralizedModelId}($where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $limit: Int, $after: String) {
            content: list${ucFirstPluralizedModelId}(
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsEntriesDelete${ucFirstModelId}($revision: ID!) {
            content: delete${ucFirstModelId}(revision: $revision) {
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsEntriesCreate${ucFirstModelId}($data: ${ucFirstModelId}Input!) {
            content: create${ucFirstModelId}(data: $data) {
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsCreate${ucFirstModelId}From($revision: ID!, $data: ${ucFirstModelId}Input) {
            content: create${ucFirstModelId}From(revision: $revision, data: $data) {
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsUpdate${ucFirstModelId}($revision: ID!, $data: ${ucFirstModelId}Input!) {
            content: update${ucFirstModelId}(revision: $revision, data: $data) {
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsPublish${ucFirstModelId}($revision: ID!) {
            content: publish${ucFirstModelId}(revision: $revision) {
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
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsUnpublish${ucFirstModelId}($revision: ID!) {
            content: unpublish${ucFirstModelId}(revision: $revision) {
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
