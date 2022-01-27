import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import pick from "lodash/pick";
import debounce from "lodash/debounce";
import { LIST_PAGES } from "./graphql";

interface UsePbPagesResult {
    loading: boolean;
    query: string;
    setQuery: (query: string) => void;
    options: Record<string, any>[];
}

export const usePbPages = (): UsePbPagesResult => {
    const [query, setQuery] = useState<string>("");
    const [search, setSearch] = useState<{ query: string }>({ query });

    const performSearch = useMemo(() => {
        return debounce(query => setSearch({ query }), 250);
    }, []);
    /**
     * Perform debounced search whenever "query" has changed.
     */
    useEffect(() => {
        performSearch(query);
    }, [query]);

    const { data, loading } = useQuery(LIST_PAGES, {
        variables: {
            search,
            where: {},
            sort: "createdOn_DESC"
        }
    });

    const pagesList = get(data, "pageBuilder.listPages.data", []);
    const options = useMemo(() => pagesList.map(page => pick(page, ["title", "id"])), [pagesList]);

    return {
        options,
        loading,
        query,
        setQuery
    };
};
