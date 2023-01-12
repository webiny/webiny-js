import gql from "graphql-tag";
import { ApiError, TransportSettings, ValidationErrors } from "~/types";

const SETTINGS_FIELDS = `
    {
        host
        port
        user
        from
        replyTo
    }
`;

const ERROR_FIELDS = `
    {
        message
        code
        data
    }
`;

export interface SettingsQueryResponse {
    mailer: {
        settings: {
            data: TransportSettings | null;
            error: ApiError | null;
        };
    };
}
export const GET_SETTINGS_QUERY = gql`
    query GetMailerSettings {
        mailer {
            settings: getSettings {
                data ${SETTINGS_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export interface SaveSettingsMutationVariables {
    data: TransportSettings & {
        password?: string;
    };
}

export interface SaveSettingsMutationResponse {
    mailer: {
        settings: {
            data: TransportSettings | null;
            error: ApiError<ValidationErrors> | null;
        };
    };
}
export const SAVE_SETTINGS_MUTATION = gql`
    mutation SaveTransportSettings($data: MailerTransportSettingsInput!) {
        mailer {
            settings: saveSettings(data: $data) {
                data ${SETTINGS_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;
