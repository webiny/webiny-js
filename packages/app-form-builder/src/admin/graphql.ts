import gql from "graphql-tag";
import {
    FbErrorResponse,
    FbFormModel,
    FbFormSubmissionData,
    FbMetaResponse,
    FbRevisionModel,
    FormBuilderImportExportSubTask
} from "~/types";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_FORM_FIELDS = `  
    id
    name
    version
    published
    status
    savedOn
    createdBy {
        id
        displayName
    }
`;

const STATS = `
stats {
    total
    processing
    pending
    completed
    failed
}
`;
/**
 * ####################
 * List Forms Query
 */
export interface ListFormsQueryResponse {
    formBuilder: {
        listForms: {
            data: FbFormModel[];
            error: FbErrorResponse | null;
        };
    };
}
export const LIST_FORMS = gql`
    query FbListForms {
        formBuilder {
            listForms {
                data {  
                    ${BASE_FORM_FIELDS}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
/**
 * ####################
 * Create Form Mutation
 */
export interface CreateFormMutationResponse {
    formBuilder: {
        form: {
            data: FbRevisionModel | null;
            error: FbErrorResponse | null;
        };
    };
}
export interface CreateFormMutationVariables {
    data: {
        name: string;
    };
}
export const CREATE_FORM = gql`
    mutation FormsCreateForm($name: String!) {
        formBuilder {
            form: createForm(data: { name: $name }) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/**
 * ########################
 * Get Form Revision Query
 */
export interface GetFormRevisionQueryResponse {
    formBuilder: {
        form: {
            data: FbRevisionModel | null;
            error: FbErrorResponse | null;
        };
    };
}
export interface GetFormRevisionQueryVariables {
    revision: string;
}
export const GET_FORM = gql`
    query FbGetForm($revision: ID!) {
        formBuilder {
            form: getForm(revision: $revision) {
                data {
                    ${BASE_FORM_FIELDS}
                    overallStats {
                        views
                        submissions
                        conversionRate
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/**
 * ####################
 * Get Forms Revisions Query
 */
export interface GetFormRevisionsQueryResponse {
    formBuilder: {
        revisions: {
            data: FbRevisionModel[];
            error: FbErrorResponse | null;
        };
    };
}
export interface GetFormRevisionsQueryVariables {
    id: string;
}
export const GET_FORM_REVISIONS = gql`
    query FbGetFormRevisions($id: ID!) {
        formBuilder {
            revisions: getFormRevisions(id: $id) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/**
 * ############################
 * List Form Submissions Query Response
 */
export interface ListFormSubmissionsQueryResponse {
    formBuilder: {
        listFormSubmissions: {
            data: FbFormSubmissionData[];
            error: FbErrorResponse | null;
            meta: FbMetaResponse;
        };
    };
}
export interface ListFormSubmissionsQueryVariables {
    form: string;
    sort: string[];
    limit?: number | null;
    after?: string | null;
}
export const LIST_FORM_SUBMISSIONS = gql`
    query FbListFormSubmissions(
        $form: ID!
        $sort: [FbSubmissionSort!]
        $limit: Int
        $after: String
    ) {
        formBuilder {
            listFormSubmissions(form: $form, sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    data
                    meta {
                        ip
                        submittedOn
                        url {
                            location
                            query
                        }
                    }
                    form {
                        id
                        name
                        version
                        fields {
                            _id
                            fieldId
                            type
                            label
                            options {
                                label
                                value
                            }
                        }
                        steps {
                            title
                            layout
                        }
                    }
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
/**
 * ####################
 * Export Form Submissions Mutation
 */
export interface ExportFormSubmissionsMutationResponse {
    formBuilder: {
        exportFormSubmissions: {
            data: {
                src: string;
            };
            error: FbErrorResponse | null;
        };
    };
}
export interface ExportFormSubmissionsMutationVariables {
    form: string;
}
export const EXPORT_FORM_SUBMISSIONS = gql`
    mutation FormsExportFormSubmissions($form: ID!) {
        formBuilder {
            exportFormSubmissions(form: $form) {
                data {
                    src
                }
                error {
                    message
                }
            }
        }
    }
`;
/**
 * ####################
 * Create Revision From Mutation
 */
export interface CreateRevisionFromMutationResponse {
    formBuilder: {
        revision: {
            data: FbRevisionModel;
            error: FbErrorResponse | null;
        };
    };
}
export interface CreateRevisionFromMutationVariables {
    revision: string;
}
export const CREATE_REVISION_FROM = gql`
    mutation FormsCreateRevisionFrom($revision: ID!) {
        formBuilder {
            revision: createRevisionFrom(revision: $revision) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
/**
 * ##############################
 * Publish Revision Mutation Response
 */
export interface PublishRevisionMutationResponse {
    formBuilder: {
        publishRevision: {
            data: FbRevisionModel;
            error: FbErrorResponse | null;
        };
    };
}
export interface PublishRevisionMutationVariables {
    revision: string;
}
export const PUBLISH_REVISION = gql`
    mutation FormsPublishRevision($revision: ID!) {
        formBuilder {
            publishRevision(revision: $revision) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/**
 * ##############################
 * Unpublish Revision Mutation Response
 */
export interface UnpublishRevisionMutationResponse {
    formBuilder: {
        unpublishRevision: {
            data: FbRevisionModel;
            error: FbErrorResponse | null;
        };
    };
}
export interface UnpublishRevisionMutationVariable {
    revision: string;
}
export const UNPUBLISH_REVISION = gql`
    mutation FormsUnpublishRevision($revision: ID!) {
        formBuilder {
            unpublishRevision(revision: $revision) {
                data {
                    ${BASE_FORM_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_REVISION = gql`
    mutation FormsDeleteRevision($revision: ID!) {
        formBuilder {
            deleteForm: deleteRevision(revision: $revision) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_FORM = gql`
    mutation DeleteForm($id: ID!) {
        formBuilder {
            deleteForm(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const IMPORT_FORMS = gql`
    mutation FbImportForm(
        $zipFileUrl: String
    ) {
        formBuilder {
            importForms(
                zipFileUrl: $zipFileUrl
            ) {
                data {
                    task {
                        id
                        status
                        data
                        ${STATS}
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const EXPORT_FORMS = gql`
    mutation FbExportForms(
        $ids: [ID!],
        $revisionType: FbExportFormRevisionType!,
    ) {
        formBuilder {
            exportForms(
                ids: $ids,
                revisionType: $revisionType
            ) {
                data {
                    task {
                        id
                        status
                        data
                        ${STATS}
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const GET_FORM_IMPORT_EXPORT_TASK = gql`
    query FbGetFormImportExportTask($id: ID!) {
        pageBuilder {
            getImportExportTask(id: $id) {
                data {
                    status
                    data
                    error
                    ${STATS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export interface ListFormImportExportSubTasksResponse {
    pageBuilder: {
        listImportExportSubTask: {
            data: FormBuilderImportExportSubTask[];
            error?: {
                message: string;
                code: string;
                data: Record<string, any>;
            };
        };
    };
}

export const LIST_FORM_IMPORT_EXPORT_SUB_TASKS = gql`
    query FbFormListFormImportExportSubTask($id: ID!, $status: PbImportExportTaskStatus, $limit: Int) {
        pageBuilder {
            listImportExportSubTask(id: $id, status: $status, limit: $limit) {
                data {
                    id
                    status
                    data
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
