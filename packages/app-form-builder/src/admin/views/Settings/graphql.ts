import gql from "graphql-tag";
import { FbErrorResponse, FbSettings } from "~/types";

const fields = /* GraphQL */ `
    {
        data {
            reCaptcha {
                enabled
                siteKey
                secretKey
            }
            domain
        }
        error {
            data
            code
            message
        }
    }
`;

export interface GetFormSettingsQueryResponse {
    formBuilder: {
        getSettings: {
            data: FbSettings;
            error?: FbErrorResponse;
        };
    };
}
export interface UpdateFormSettingsMutationResponse {
    formBuilder: {
        updateSettings: {
            data: FbSettings;
            error?: FbErrorResponse;
        };
    };
}
export interface UpdateFormSettingsMutationVariables {
    data: {
        domain: string;
        reCaptcha: {
            enabled: boolean;
            siteKey: string;
            secretKey: string;
        };
    };
}
const graphql = {
    query: gql`
            query GetSettings { 
                formBuilder {
                    getSettings 
                        ${fields}
                }
            }
        `,
    mutation: gql`
            mutation UpdateSettings($data: FbSettingsInput) {
                formBuilder {
                    updateSettings(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
