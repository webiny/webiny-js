import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { LIST_PAGES } from "./graphql";
import { PbPage } from "~/types";

interface UsePbPagesResult {
    pages: PbPage[];
    loading: boolean;
    query: string;
    setQuery: (query: string) => void;
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

    return {
        pages: get(data, "pageBuilder.listPages.data", []),
        loading,
        query,
        setQuery
    };
};
