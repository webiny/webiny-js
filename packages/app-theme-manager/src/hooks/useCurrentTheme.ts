import { useEffect } from "react";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { DocumentNode } from "graphql";
import { GET_THEME } from "~/graphql/GET_THEME";

// We need to keep track of the queries that have already been executed.
const cache = new Map<DocumentNode, boolean>();

const useQueryOnce = (QUERY: DocumentNode) => {
    /**
     * We want to share the result of this query across multiple hooks/components.
     * Problem is that `useQuery` will keep issuing network requests on every rerender, until the data is available in
     * its cache. To solve this, we force it to read from cache only, and then run the query to fetch the data
     * explicitly, in `useEffect`, and we only do it once.
     *
     * Once we have the data, we need to update the original `useQuery` result using its `updateQuery`.
     * Once executed, it will force the original `useQuery` to return the new data.
     */
    const { data, client, updateQuery } = useQuery(QUERY, { fetchPolicy: "cache-only" });

    useEffect(() => {
        if (!cache.has(QUERY)) {
            cache.set(QUERY, true);
            client.query({ query: QUERY }).then(({ data }) => updateQuery(() => data));
        }
    }, []);

    return data;
};

export const useCurrentTheme = (): string | null => {
    const data = useQueryOnce(GET_THEME);

    return get(data, "pageBuilder.getSettings.data.theme", null);
};
