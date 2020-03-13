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
        cmsManage {
            getSettings ${fields}
        }
    }
`;

export const UPDATE_CONTENT_MODELS_SETTINGS = gql`
    mutation updateSettings($data: FormsSettingsInput) {
        cmsManage {
            updateSettings(data: $data) ${fields}
        }
    }
`;
