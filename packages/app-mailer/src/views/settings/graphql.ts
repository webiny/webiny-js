import gql from "graphql-tag";
import type { ApiError, TransportSettings, ValidationErrors } from "~/types.js";

const SETTINGS_FIELDS = `
    {
        host
        port
        user
        from
        replyTo
        source
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

/** Settings as they appear in GraphQL responses — never includes the password. */
export type PublicTransportSettings = Omit<TransportSettings, "password"> & {
    source?: MailerSettingsSource;
};

export interface SettingsQueryResponse {
    mailer: {
        settings: {
            data: PublicTransportSettings | null;
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
    data: TransportSettings;
}

export interface SaveSettingsMutationResponse {
    mailer: {
        settings: {
            data: PublicTransportSettings | null;
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
