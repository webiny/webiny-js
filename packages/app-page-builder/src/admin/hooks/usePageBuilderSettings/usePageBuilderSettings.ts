import { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import getPagePreviewUrlFunction from "./getPagePreviewUrl";

function useSiteStatus(url) {
    const [active, setActive] = useState(true);

    useEffect(() => {
        async function getResponse(url) {
            let response = null;
            try {
                response = await fetch(url, {
                    method: "GET",
                    mode: "no-cors"
                });
                setActive(response);
            } catch (e) {
                console.error(e);
                setActive(false);
            }
        }

        if (url && url.includes("localhost")) {
            getResponse(url).then(() => console.log(`Done!!`));
        }
    }, [url]);

    return active;
}

export const DOMAIN_QUERY = gql`
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

    const isSiteRunning = useSiteStatus(getDomain());

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
            return getPagePreviewUrlFunction({ page, domain: getDomain() });
        },
        [data, loading]
    );

    return {
        isSiteRunning,
        getDomain,
        getPageUrl,
        getPagePreviewUrl,
        data: loading ? null : get(data, "pageBuilder.getSettings.data")
    };
}
