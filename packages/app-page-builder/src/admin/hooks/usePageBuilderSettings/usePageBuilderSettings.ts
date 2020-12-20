import { useCallback } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import getPagePreviewUrlFunction from "./getPagePreviewUrl";

export const WEBSITE_URL_QUERY = gql`
    query PbGetWebsiteUrl {
        pageBuilder {
            getSettings {
                id
                data {
                    websiteUrl
                }
            }
        }
    }
`;

export function usePageBuilderSettings() {
    const { data, loading } = useQuery(WEBSITE_URL_QUERY);

    const getWebsiteUrl = () => {
        return get(data, "pageBuilder.getSettings.data.websiteUrl");
    };

    const getPageUrl = useCallback(
        page => {
            if (loading) {
                return null;
            }
            return getWebsiteUrl() + page.path;
        },
        [data, loading]
    );

    const getPagePreviewUrl = useCallback(
        page => {
            if (loading) {
                return null;
            }
            return getPagePreviewUrlFunction({ page, websiteUrl: getWebsiteUrl() });
        },
        [data, loading]
    );

    return {
        getWebsiteUrl,
        getPageUrl,
        getPagePreviewUrl,
        data: loading ? null : get(data, "pageBuilder.getSettings.data")
    };
}
