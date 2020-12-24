import { useQuery, useMutation } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";

const DATA_FIELDS = /* GraphQL */ `
    {
        id
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
                error
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

export const GET_SETTINGS = gql`
    query GetSettings {
        pageBuilder {
            getSettings ${DATA_FIELDS}
            getDefaultSettings ${DATA_FIELDS}
        }
    }
`;

export const UPDATE_SETTINGS = gql`
    mutation UpdateSettings($data: PbSettingsInput!) {
        pageBuilder {
            updateSettings(data: $data) ${DATA_FIELDS}
        }
    }
`;

export function usePageBuilderSettings() {
    const getSettingsQuery = useQuery(GET_SETTINGS);

    const settings = get(getSettingsQuery, "data.pageBuilder.getSettings.data") || {};
    const defaultSettings = get(getSettingsQuery, "data.pageBuilder.getDefaultSettings.data") || {};

    const getWebsiteUrl = (preview = false) => {
        if (preview) {
            return settings.websitePreviewUrl || defaultSettings.websitePreviewUrl;
        }
        return settings.websiteUrl || defaultSettings.websiteUrl;
    };

    const getPageUrl = (page, preview = false) => {
        return getWebsiteUrl(preview) + page.path;
    };

    const isSpecialPage = (page, type: "home" | "error" | "notFound") => {
        if (!settings.pages?.[type]) {
            return false;
        }

        return settings.pages[type] === page.pid;
    };

    const updateSettingsMutation = useMutation(UPDATE_SETTINGS);
    return {
        getWebsiteUrl,
        getPageUrl,
        isSpecialPage,
        settings,
        defaultSettings,
        getSettingsQuery,
        updateSettingsMutation
    };
}
