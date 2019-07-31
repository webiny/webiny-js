import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            reCaptcha {
                enabled
                siteKey
            }
        }
        error {
            message
        }
    }
`;

export const GET_RECAPTCHA_SETTINGS = gql`
    query GetReCaptchaSettings {
        settings {
            forms {
                data {
                    reCaptcha {
                        enabled
                        siteKey
                    }
                }
            }
        }
    }
`;

export const UPDATE_FORMS_SETTINGS = gql`
    mutation updateSettings($data: FormsSettingsInput) {
        settings {
            forms(data: $data) ${fields}
        }
    }
`;
