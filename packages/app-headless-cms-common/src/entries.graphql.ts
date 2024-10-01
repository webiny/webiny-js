import gql from "graphql-tag";
import {
    CmsContentEntryRevision,
    CmsContentEntry,
    CmsEditorContentModel,
    CmsErrorResponse,
    CmsMetaResponse,
    CmsModelField,
    CmsModel
} from "~/types";
import { createFieldsList } from "./createFieldsList";
import { getModelTitleFieldId } from "./getModelTitleFieldId";
import { FormValidationOptions } from "@webiny/form";
import { CMS_MODEL_SINGLETON_TAG } from "./constants";

const CONTENT_META_FIELDS = /* GraphQL */ `
    title
    description
    image
    version
    locked
    status
`;

const createEntrySystemFields = (model: CmsModel) => {
    const isSingletonModel = model.tags.includes(CMS_MODEL_SINGLETON_TAG);

    let optionalFields = "";
    if (!isSingletonModel) {
        optionalFields = `
            wbyAco_location {
                folderId
            }
            meta  {
                ${CONTENT_META_FIELDS}
            }
        `;
    }

    return /* GraphQL */ `
        id
        entryId
        createdOn
        savedOn
        modifiedOn,
        deletedOn
        firstPublishedOn
        lastPublishedOn
        createdBy {
            id
            type
            displayName
        }
        savedBy {
            id
            type
            displayName
        }
        modifiedBy {
            id
            type
            displayName
        }
        deletedBy {
            id
            type
            displayName
        }
        firstPublishedBy {
            id
            type
            displayName
        }
        lastPublishedBy {
            id
            type
            displayName
        }
        revisionCreatedOn
        revisionSavedOn
        revisionModifiedOn
        revisionDeletedOn
        revisionFirstPublishedOn
        revisionLastPublishedOn
        revisionCreatedBy {
            id
            type
            displayName
        }
        revisionSavedBy {
            id
            type
            displayName
        }
        revisionModifiedBy {
            id
            type
            displayName
        }
        revisionDeletedBy {
            id
            type
            displayName
        }
        revisionFirstPublishedBy {
            id
            type
            displayName
        }
        revisionLastPublishedBy {
            id
            type
            displayName
        }
        revisionCreatedOn
        revisionSavedOn
        revisionModifiedOn
        revisionFirstPublishedOn
        revisionLastPublishedOn
        revisionCreatedBy {
            id
            type
            displayName
        }
        revisionSavedBy {
            id
            type
            displayName
        }
        revisionModifiedBy {
            id
            type
            displayName
        }
        revisionFirstPublishedBy {
            id
            type
            displayName
        }
        revisionLastPublishedBy {
            id
            type
            displayName
        }
        ${optionalFields}
    `;
};

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

/**
 * ############################################
 * Get CMS Entry Query
 */
export interface CmsEntryGetQueryResponse {
    content: {
        data: CmsContentEntry;
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
                    ${createEntrySystemFields(model)}
                    ${createFieldsList({ model, fields: model.fields })}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

/**
 * ############################################
 * Get CMS Singleton Entry Query
 */
export interface CmsEntryGetSingletonQueryResponse {
    content: {
        data: CmsContentEntry;
        error: CmsErrorResponse | null;
    };
}

export const createReadSingletonQuery = (model: CmsEditorContentModel) => {
    return gql`
        query CmsEntryGetSingleton${model.singularApiName} {
            content: get${model.singularApiName} {
                data {
                    ${createEntrySystemFields(model)}
                    ${createFieldsList({ model, fields: model.fields })}
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
                    ${createEntrySystemFields(model)}
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
        data: CmsContentEntry[];
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

export const createListQueryDataSelection = (
    model: CmsEditorContentModel,
    fields?: CmsModelField[]
) => {
    return `
        ${createEntrySystemFields(model)}
        ${fields ? createFieldsList({ model, fields }) : ""}
        ${!fields ? getModelTitleFieldId(model) : ""}
    `;
};

export const createListQuery = (
    model: CmsEditorContentModel,
    fields?: CmsModelField[],
    deleted?: boolean
) => {
    const queryName = deleted ? `Deleted${model.pluralApiName}` : model.pluralApiName;

    return gql`
        query CmsEntriesList${queryName}($where: ${model.singularApiName}ListWhereInput, $sort: [${
        model.singularApiName
    }ListSorter], $limit: Int, $after: String, $search: String) {
            content: list${queryName}(
            where: $where
            sort: $sort
            limit: $limit
            after: $after
            search: $search
            ) {
                data {
                    ${createListQueryDataSelection(model, fields)}
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
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

export interface CmsEntryDeleteMutationVariables {
    revision: string;
    permanently?: boolean;
}

export const createDeleteMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsEntriesDelete${model.singularApiName}($revision: ID!, $permanently: Boolean) {
            content: delete${model.singularApiName}(revision: $revision, options: {permanently: $permanently}) {
                data
                error ${ERROR_FIELD}
            }
        }
    `;
};

/**
 * ############################################
 * Restore from bin Mutation
 */
export interface CmsEntryRestoreFromBinMutationResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

export interface CmsEntryRestoreFromBinMutationVariables {
    revision: string;
}

export const createRestoreFromBinMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsEntriesRestore${model.singularApiName}FromBin($revision: ID!) {
            content: restore${model.singularApiName}FromBin(revision: $revision) {
                data {
                    ${createEntrySystemFields(model)}
                    ${createFieldsList({ model, fields: model.fields })}
                }
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
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

export interface CmsEntryCreateMutationVariables {
    /**
     * We have any here because we do not know which fields does entry have
     */
    data: Record<string, any>;
    options?: FormValidationOptions;
}

export const createCreateMutation = (model: CmsEditorContentModel) => {
    const createFields = createFieldsList({ model, fields: model.fields });

    return gql`
        mutation CmsEntriesCreate${model.singularApiName}($data: ${
        model.singularApiName
    }Input!, $options: CreateCmsEntryOptionsInput) {
            content: create${model.singularApiName}(data: $data, options: $options) {
                data {
                    ${createEntrySystemFields(model)}
                    ${createFields}
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
        data?: CmsContentEntry;
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryCreateFromMutationVariables {
    revision: string;
    /**
     * We have any here because we do not know which fields does entry have
     */
    data?: Record<string, any>;
    options?: FormValidationOptions;
}

export const createCreateFromMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsCreate${model.singularApiName}From($revision: ID!, $data: ${
        model.singularApiName
    }Input, $options: CreateRevisionCmsEntryOptionsInput) {
        content: create${
            model.singularApiName
        }From(revision: $revision, data: $data, options: $options) {
                data {
                    ${createEntrySystemFields(model)}
                    ${createFieldsList({ model, fields: model.fields })}
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
        data?: CmsContentEntry;
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryUpdateMutationVariables {
    revision: string;
    /**
     * We have any here because we do not know which fields does entry have
     */
    data: Record<string, any>;
    options?: FormValidationOptions;
}

export const createUpdateMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsUpdate${model.singularApiName}($revision: ID!, $data: ${
        model.singularApiName
    }Input!, $options: UpdateCmsEntryOptionsInput) {
            content: update${
                model.singularApiName
            }(revision: $revision, data: $data, options: $options) {
                data {
                    ${createEntrySystemFields(model)}
                    ${createFieldsList({ model, fields: model.fields })}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

/**
 * ############################################
 * Update Singleton Mutation
 */
export interface CmsEntryUpdateSingletonMutationResponse {
    content: {
        data?: CmsContentEntry;
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryUpdateSingletonMutationVariables {
    /**
     * We have any here because we do not know which fields does entry have
     */
    data: Record<string, any>;
    options?: FormValidationOptions;
}

export const createUpdateSingletonMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsUpdate${model.singularApiName}($data: ${
        model.singularApiName
    }Input!, $options: UpdateCmsEntryOptionsInput) {
            content: update${model.singularApiName}(data: $data, options: $options) {
            data {
                ${createEntrySystemFields(model)}
                ${createFieldsList({ model, fields: model.fields })}
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
        data?: CmsContentEntry;
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
                    ${createEntrySystemFields(model)}
                    ${createFieldsList({ model, fields: model.fields })}
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
        data?: CmsContentEntry;
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
                    ${createEntrySystemFields(model)}
                    ${createFieldsList({ model, fields: model.fields })}
                }
                error ${ERROR_FIELD}
            }
        }`;
};

/**
 * ############################################
 * Bulk Action Mutation
 */
export interface CmsEntryBulkActionMutationResponse {
    content: {
        data?: {
            id: string;
        };
        error?: CmsErrorResponse;
    };
}

export interface CmsEntryBulkActionMutationVariables {
    action: string;
    where?: {
        [key: string]: any;
    };
    search?: string;
    data?: {
        [key: string]: any;
    };
}

export const createBulkActionMutation = (model: CmsEditorContentModel) => {
    return gql`
        mutation CmsBulkAction${model.singularApiName}($action: BulkAction${model.singularApiName}Name!, $where: ${model.singularApiName}ListWhereInput, $search: String, $data: JSON) {
            content: bulkAction${model.singularApiName}(action: $action, where: $where, search: $search, data: $data) {
                 data {
                    id
                }
                error ${ERROR_FIELD}
            }
        }`;
};
