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
            steps {
                title
                layout
            }
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
    mutation CreateFormSubmission($revision: ID!, $data: JSON!, $reCaptchaResponseToken: String, $meta: JSON) {
        formBuilder {
            createFormSubmission(revision: $revision, data: $data, reCaptchaResponseToken: $reCaptchaResponseToken, meta:  $meta) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const EXPORT_FORM_SUBMISSIONS = /* GraphQL */ `
    mutation ExportFormSubmissions($form: ID!) {
        formBuilder {
            exportFormSubmissions(form: $form) {
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
    query ListFormSubmissions($form: ID!, $sort: [FbSubmissionSort!], $limit: Int, $after: String) {
        formBuilder {
            listFormSubmissions(form: $form, sort: $sort, limit: $limit, after: $after) {
                data ${DATA_FIELD}
                meta {
                    cursor
                    totalCount
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
