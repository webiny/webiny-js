export const DATA_FIELD = /* GraphQL */ `
    {
        id
        data
        meta {
            ip
            submittedOn
        }
        form {
            revision {
                id
                name
            }
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_FROM_SUBMISSION = /* GraphQL */ `
    mutation CreateFormSubmission($id: ID!, $data: JSON!, $reCaptchaResponseToken: String, $meta: JSON) {
        forms {
            createFormSubmission(id: $id, data: $data, reCaptchaResponseToken: $reCaptchaResponseToken, meta:  $meta) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const EXPORT_FROM_SUBMISSION = /* GraphQL */ `
    mutation ExportFormSubmissions($ids: [ID], $parent: ID, $form: ID) {
        forms {
            exportFormSubmissions(ids: $ids, parent: $parent, form: $form) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FROM_SUBMISSION = /* GraphQL */ `
    query GetFormSubmission($id: ID, $where: JSON, $sort: String) {
        forms {
            getFormSubmission(id: $id, where: $where, sort: $sort) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FROM_SUBMISSION = /* GraphQL */ `
    query ListFormSubmissions($search: String, $where: JSON, $sort: JSON, $limit: Int, $after: String, $before: String) {
        forms {
            listFormSubmissions(search: $search, where: $where, sort: $sort, limit: $limit, after: $after, before: $before) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
