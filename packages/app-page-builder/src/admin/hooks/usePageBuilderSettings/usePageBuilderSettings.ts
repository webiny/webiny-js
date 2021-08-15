import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { get } from "lodash";
import { useTenancy } from "@webiny/app-tenancy/hooks/useTenancy";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

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
    const { tenant } = useTenancy();
    const { getCurrentLocale } = useI18N();

    const settings = get(getSettingsQuery, "data.pageBuilder.getSettings.data") || {};
    const defaultSettings = get(getSettingsQuery, "data.pageBuilder.getDefaultSettings.data") || {};

    const getWebsiteUrl = (preview = false) => {
        if (preview) {
            return settings.websitePreviewUrl || defaultSettings.websitePreviewUrl;
        }
        return settings.websiteUrl || defaultSettings.websiteUrl;
    };

    const getPageUrl = (page, preview = false) => {
        const url = getWebsiteUrl(preview) + page.path;
        if (!preview || page.status === "published") {
            return url;
        }

        // We must append `preview` query param if page status is not `published`.
        const query = [
            "preview=" + encodeURIComponent(page.id),
            "__locale=" + getCurrentLocale("content"),
            tenant ? "__tenant=" + tenant : null
        ];

        return url + "?" + query.filter(Boolean).join("&");
    };

    const isSpecialPage = (page, type: "home" | "notFound") => {
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
