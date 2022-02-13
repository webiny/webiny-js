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
        }
        error {
            message
            code
            data
        }
    }
`;
/**
 * ########################
 * Get ReCaptcha Settings Query
 */
export interface GetReCaptchaSettingsQueryResponse {
    formBuilder: {
        getSettings: {
            data: Omit<FbSettings, "domain">;
            error?: FbErrorResponse;
        };
    };
}
export const GET_RECAPTCHA_SETTINGS = gql`
    query getReCaptchaSettings {
        formBuilder {
            getSettings ${fields}
        }
    }
`;
/**
 * #####################
 * Update Forms Settings Mutation
 */
export interface UpdateFormsSettingsMutationResponse {
    formBuilder: {
        updateSettings: {
            data: Omit<FbSettings, "domain">;
            error?: FbErrorResponse;
        };
    };
}
export interface FbSettingsInput {
    domain: string;
    reCaptcha: {
        enabled: boolean;
        siteKey: string;
        secretKey: string;
    };
}
export interface UpdateFormsSettingsMutationVariables {
    data: FbSettingsInput;
}
export const UPDATE_FORMS_SETTINGS = gql`
    mutation updateSettings($data: FbSettingsInput) {
        formBuilder {
            updateSettings(data: $data) ${fields}
        }
    }
`;
