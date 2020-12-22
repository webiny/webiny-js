import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";

const DATA_FIELDS = /* GraphQL */ `
    {
        websiteUrl
        websitePreviewUrl
    }
`;

export const SETTINGS_QUERY = gql`
    query PbGetWebsiteUrl {
        pageBuilder {
            getSettings {
                id
                data ${DATA_FIELDS}
            }
            getDefaultSettings {
                id
                data ${DATA_FIELDS}
            }
        }
    }
`;

export function usePageBuilderSettings() {
    const settingsQuery = useQuery(SETTINGS_QUERY);

    const settings = get(settingsQuery, "data.pageBuilder.getSettings.data") || {};
    const defaultSettings = get(settingsQuery, "data.pageBuilder.getDefaultSettings.data") || {};

    const getWebsiteUrl = (preview = false) => {
        if (preview) {
            return settings.websitePreviewUrl || defaultSettings.websitePreviewUrl;
        }
        return settings.websiteUrl || defaultSettings.websiteUrl;
    };

    const getPageUrl = (page, preview = false) => {
        return getWebsiteUrl(preview) + page.path;
    };

    return {
        getWebsiteUrl,
        getPageUrl,
        settings,
        defaultSettings
    };
}
