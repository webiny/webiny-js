// @flow
import { useCallback } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import formatPreviewUrl from "./formatPreviewUrl";

const DOMAIN_QUERY = gql`
    {
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

    const getPagePreviewUrl = useCallback(
        (page: Object) => {
            if (loading) {
                return null;
            }
            const domain = get(data, "pageBuilder.getSettings.data.domain");
            return formatPreviewUrl({ page, domain });
        },
        [data, loading]
    );

    return { getPagePreviewUrl, data: loading ? null : get(data, "pageBuilder.getSettings.data") };
}
