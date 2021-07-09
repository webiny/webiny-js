import upperFirst from "lodash/upperFirst";
import gql from "graphql-tag";
import pluralize from "pluralize";
import { CmsEditorContentModel } from "~/types";
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

export const createReadQuery = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsEntriesGet${ucFirstModelId}($revision: ID!) {
            content: get${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    createdBy {
                        id
                    }
                    ${createFieldsList(model)}
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

export const createRevisionsQuery = model => {
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

export const createDeleteMutation = model => {
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

export const createCreateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsEntriesCreate${ucFirstModelId}($data: ${ucFirstModelId}Input!) {
            content: create${ucFirstModelId}(data: $data) {
                data {
                    id
                    savedOn
                    ${createFieldsList(model)}
                    meta {
                        ${CONTENT_META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const createCreateFromMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsCreate${ucFirstModelId}From($revision: ID!, $data: ${ucFirstModelId}Input) {
            content: create${ucFirstModelId}From(revision: $revision, data: $data) {
                data {
                    id
                    savedOn
                    ${createFieldsList(model)}
                    meta {
                        ${CONTENT_META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }`;
};

export const createUpdateMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsUpdate${ucFirstModelId}($revision: ID!, $data: ${ucFirstModelId}Input!) {
            content: update${ucFirstModelId}(revision: $revision, data: $data) {
                data {
                    id
                    ${createFieldsList(model)}
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

export const createPublishMutation = model => {
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

export const createUnpublishMutation = model => {
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

export const createRequestReviewMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsRequest${ucFirstModelId}Review($revision: ID!) {
            content: request${ucFirstModelId}Review(revision: $revision) {
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

export const createRequestChangesMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsRequest${ucFirstModelId}Changes($revision: ID!) {
            content: request${ucFirstModelId}Changes(revision: $revision) {
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
