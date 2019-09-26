import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            reCaptcha {
                enabled
                siteKey
                secretKey
            }
        }
        error {
            message
        }
    }
`;

export const GET_RECAPTCHA_SETTINGS = gql`
    query getReCaptchaSettings {
        forms {
            getSettings ${fields}
        }
    }
`;

export const UPDATE_FORMS_SETTINGS = gql`
    mutation updateSettings($data: FormsSettingsInput) {
        forms {
            updateSettings(data: $data) ${fields}
        }
    }
`;
