export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const GET_FORM_STATS = /* GraphQL */ `
    query FbGetFormStats($id: ID!) {
        formBuilder {
            getFormStats(formId: $id) {
                data {
                    id
                    formId
                    formVersion
                    views
                    submissions
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FORM_OVERALL_STATS = /* GraphQL */ `
    query FbGetFormOverallStats($id: ID!) {
        formBuilder {
            getFormOverallStats(formId: $id) {
                data {
                    views
                    submissions
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
