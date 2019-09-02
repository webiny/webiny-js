// @flow
import { useCallback } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import formatPreviewUrl from "./utils/formatPreviewUrl";
import { get } from "lodash";

const domainQuery = gql`
    {
        pageBuilder {
            getSettings {
                data {
                    domain
                }
            }
        }
    }
`;

export function usePageBuilderSettings() {
    const { data, loading } = useQuery(domainQuery);

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
