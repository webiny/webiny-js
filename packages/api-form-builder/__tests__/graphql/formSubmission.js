export const DATA_FIELD = /* GraphQL */ `
    {
        id
        data
        meta {
            ip
            submittedOn
        }
        form {
            id
            parent
            name
            version
            layout
            fields {
                _id
                fieldId
                type
                name
                label
                placeholderText
                helpText
                options {
                    label
                    value
                }
                validation {
                    name
                }
                settings
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
    mutation CreateFormSubmission($form: ID!, $data: JSON!, $reCaptchaResponseToken: String, $meta: JSON) {
        formBuilder {
            createFormSubmission(form: $form, data: $data, reCaptchaResponseToken: $reCaptchaResponseToken, meta:  $meta) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const EXPORT_FORM_SUBMISSIONS = /* GraphQL */ `
    mutation ExportFormSubmissions($form: ID!, $ids: [ID!]) {
        formBuilder {
            exportFormSubmissions(form: $form, ids: $ids) {
                data {
                    src
                    key
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FROM_SUBMISSIONS = /* GraphQL */ `
    query ListFormSubmissions($form: ID!, $sort: FbSubmissionSortInput, $page: Int, $perPage: Int) {
        formBuilder {
            listFormSubmissions(form: $form, sort: $sort, page: $page, perPage: $perPage) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
