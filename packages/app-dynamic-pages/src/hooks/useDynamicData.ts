import { useEffect, useState, useRef } from "react";
import get from "lodash/get";
import { useCms } from "@webiny/app-headless-cms/index";
import { composeDynamicApi, Filter, Sort } from "~/utils/composeDynamicApi";
import { getChildrenPaths } from "~/utils/getChildrenPaths";
import isEqual from "lodash/isEqual";
import { PbElement } from "~/types";

export const usePaths = (paths: string[] = []) => {
    const [prevPaths, setPrevPaths] = useState<string[]>(paths);

    useEffect(() => {
        if (prevPaths && !isEqual(prevPaths, paths)) {
            setPrevPaths(paths);
        }
    }, [paths]);

    return prevPaths;
};

export const useDynamicData = (block?: PbElement) => {
    const paths = usePaths(getChildrenPaths(block?.elements));

    const { data, loading, error } = useLoadDynamicData({
        paths,
        modelId: block?.data?.dynamicSource?.modelId,
        filter: block?.data?.dynamicSource?.filter,
        sort: block?.data?.dynamicSource?.sortRules,
        limit: block?.data?.dynamicSource?.limit
    });

    return { data, loading, error };
};

export const useDynamicDataForEditor = (
    block?: PbElement,
    templateWhereField?: Record<string, string>
) => {
    const paths = usePaths(getChildrenPaths(block?.elements));

    const { data, loading, error } = useLoadDynamicData({
        paths,
        modelId: block?.data?.dynamicSource?.modelId,
        filter: block?.data?.dynamicSource?.filter,
        sort: block?.data?.dynamicSource?.sortRules,
        limit: 1,
        templateWhereField
    });

    return { data: data?.[0], loading, error };
};

type UseLoadDynamicDataParams = {
    modelId: string;
    paths?: string[];
    filter?: Filter;
    sort?: Sort[];
    limit?: number;
    templateWhereField?: Record<string, string | undefined>;
};

export const useLoadDynamicData = ({
    modelId,
    filter,
    sort,
    limit,
    paths,
    templateWhereField
}: UseLoadDynamicDataParams) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<JSON[] | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const { readApolloClient } = useCms();

    useEffect(() => {
        if (!modelId) {
            return;
        }

        setData(null);
        setError(null);
        setLoading(true);

        const execute = async () => {
            try {
                const { query, params } = await composeDynamicApi({
                    readApolloClient,
                    paths,
                    modelId,
                    filter,
                    sort,
                    limit,
                    templateWhereField
                });
                const listQuery = await readApolloClient.query({
                    query,
                    variables: params,
                    fetchPolicy: "no-cache"
                });
                const newData = get(listQuery, `data.result.data`, null);

                if (!isMounted.current) {
                    return;
                }
                setData(newData);
                setLoading(false);
            } catch (err) {
                if (!isMounted.current) {
                    return;
                }
                console.log("Error while getting dynamic data:", err.message);
                setError(err);
                setLoading(false);
            }
        };

        execute();
    }, [modelId, paths, filter, sort, limit, templateWhereField]);

    // To prevent setting state on unmounted component
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { data, error, loading };
};
