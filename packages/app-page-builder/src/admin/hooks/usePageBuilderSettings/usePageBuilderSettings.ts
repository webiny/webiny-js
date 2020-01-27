import { useCallback } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import formatPreviewUrl from "./formatPreviewUrl";

const DOMAIN_QUERY = gql`
    query PbGetDomain {
        pageBuilder {
            getSettings {
                id
                data {
                    domain
                }
            }
        }
    }
`;

export function usePageBuilderSettings() {
    const { data, loading } = useQuery(DOMAIN_QUERY);

    const getDomain = () => {
        return get(data, "pageBuilder.getSettings.data.domain");
    };

    const getPageUrl = useCallback(
        page => {
            if (loading) {
                return null;
            }
            return getDomain() + page.url;
        },
        [data, loading]
    );

    const getPagePreviewUrl = useCallback(
        page => {
            if (loading) {
                return null;
            }
            return formatPreviewUrl({ page, domain: getDomain() });
        },
        [data, loading]
    );

    return {
        getDomain,
        getPageUrl,
        getPagePreviewUrl,
        data: loading ? null : get(data, "pageBuilder.getSettings.data")
    };
}
