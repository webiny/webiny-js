import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            websiteUrl
            websitePreviewUrl
            name
            logo {
                id
                src
            }
            favicon {
                id
                src
            }
            pages {
                home
                notFound
            }
            social {
                facebook
                twitter
                instagram
                image {
                    id
                    src
                }
            }
        }
        error {
            message
        }
    }
`;
/**
 *
 */
export interface GetSettingsResponseData {
    websiteUrl: string;
    websitePreviewUrl: string;
    name: string;
    logo: {
        id: string;
        src: string;
    };
    favicon: {
        id: string;
        src: string;
    };
    pages: {
        home: string;
        notFound: string;
    };
    social: {
        facebook: string;
        twitter: string;
        instagram: string;
        image: {
            id: string;
            src: string;
        };
    };
}

export interface GetDefaultSettingsResponseData {
    websiteUrl: string;
    websitePreviewUrl: string;
}

export interface GetSettingsResponse {
    data: GetSettingsResponseData;
    error: Error | null;
}
export interface GetDefaultSettingsResponse {
    data: GetDefaultSettingsResponseData;
    error: Error | null;
}

export interface GetSettingsQueryResponse {
    pageBuilder: {
        getSettings: GetSettingsResponse;
        getDefaultSettings: GetDefaultSettingsResponse;
    };
}
export const GET_SETTINGS = gql`
    query PbGetSettings {
        pageBuilder {
            getSettings ${fields}
            getDefaultSettings {
                data {
                    websiteUrl
                    websitePreviewUrl
                }
            }
        }
    }
`;
/**
 * ################################
 */
export interface UpdateSettingsMutationResponse {
    pageBuilder: {
        updateSettings: GetSettingsResponseData;
    };
}
export interface UpdateSettingsMutationVariablesData {
    name?: string;
    websiteUrl?: string;
    websitePreviewUrl?: string;
    favicon?: {
        id: string;
        src: string;
    };
    logo?: {
        id: string;
        src: string;
    };
    social?: {
        facebook: string;
        twitter: string;
        instagram: string;
        image: {
            id: string;
            src: string;
        };
    };
    pages?: {
        home: string;
        notFound: string;
    };
    prerendering?: {
        storage: {
            name: string;
        };
        app: {
            url: string;
        };
    };
}
export interface UpdateSettingsMutationVariables {
    data: UpdateSettingsMutationVariablesData;
}
export const UPDATE_SETTINGS = gql`
    mutation UpdateSettings($data: PbSettingsInput!) {
        pageBuilder {
            updateSettings(data: $data) ${fields}
        }
    }
`;
