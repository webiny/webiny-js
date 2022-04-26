import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import pick from "lodash/pick";
import debounce from "lodash/debounce";
import { LIST_PAGES } from "~/graphql/workflow.gql";
import { BindComponentRenderProp } from "@webiny/form/Bind";

interface UsePbPagesResult {
    loading: boolean;
    query: string;
    setQuery: (query: string) => void;
    options: Record<string, any>[];
    value: Record<"name", string>[];
}

interface UsePbPagesParams {
    bind: BindComponentRenderProp;
}

export const usePbPages = ({ bind }: UsePbPagesParams): UsePbPagesResult => {
    const [query, setQuery] = useState<string>("");
    const [search, setSearch] = useState<{ query: string }>({ query });
    const pageIds = bind.value ? bind.value : [];

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
    /**
     * Prepare the list of options for the AutoComplete.
     */
    const options = useMemo(
        () => pagesList.map((page: any) => pick(page, ["title", "id", "pid"])),
        [pagesList]
    );
    /**
     * Prepare value for the AutoComplete.
     */
    const value = useMemo(
        () => options.filter((item: any) => pageIds.includes(item.pid)),
        [options, pageIds]
    );

    return {
        options,
        loading,
        query,
        setQuery,
        value
    };
};
