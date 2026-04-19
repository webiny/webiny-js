import gql from "graphql-tag";
import type { ApiError, TransportSettings, ValidationErrors } from "~/types.js";

const SETTINGS_FIELDS = `
    {
        host
        port
        user
        password
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

export type MailerSettingsSource = "code" | "storage" | null;

export interface SettingsQueryResponse {
    mailer: {
        settings: {
            data: TransportSettings | null;
            source: MailerSettingsSource;
            error: ApiError | null;
        };
    };
}
export const GET_SETTINGS_QUERY = gql`
    query GetMailerSettings {
        mailer {
            settings: getSettings {
                data ${SETTINGS_FIELDS}
                source
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
            success: boolean | null;
            error: ApiError<ValidationErrors> | null;
        };
    };
}
export const SAVE_SETTINGS_MUTATION = gql`
    mutation SaveTransportSettings($data: MailerTransportSettingsInput!) {
        mailer {
            settings: saveSettings(data: $data) {
                success
                error ${ERROR_FIELDS}
            }
        }
    }
`;
