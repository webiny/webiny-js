import { useEffect, useState, useRef } from "react";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import { useApolloClient } from "@apollo/react-hooks";

import { useDynamicDataQuery } from "~/hooks/useDynamicDataQuery";
import { useIsDynamicElement } from "~/hooks/useIsDynamicElement";
import { getChildrenPaths } from "~/utils/getChildrenPaths";
import { RUN_QUERY } from "~/graphql";
import { PbElement } from "~/types";

export const usePaths = (paths?: string[]) => {
    const [prevPaths, setPrevPaths] = useState<string[]>();

    useEffect(() => {
        if (!isEqual(prevPaths, paths)) {
            setPrevPaths(paths);
        }
    }, [paths]);

    return prevPaths;
};

export const useDynamicData = (element?: PbElement) => {
    const { data, loading, error } = useLoadDynamicData({
        modelId: element?.data?.dynamicSource?.modelId,
        query: element?.data?.dynamicSource?.query
    });

    return { data, loading, error };
};

export const useDynamicDataForEditor = (
    element?: PbElement,
    templateWhereField?: Record<string, string>
) => {
    const isDynamic = useIsDynamicElement(element);
    const paths = usePaths(isDynamic ? getChildrenPaths(element?.elements) : undefined);
    const { data: query } = useDynamicDataQuery({
        paths,
        modelId: element?.data?.dynamicSource?.modelId,
        filter: element?.data?.dynamicSource?.filter,
        sort: element?.data?.dynamicSource?.sortRules,
        limit: 1,
        templateWhereField
    });

    const { data, loading, error } = useLoadDynamicData({
        modelId: element?.data?.dynamicSource?.modelId,
        query
    });

    return { data: data?.[0], loading, error };
};

type UseLoadDynamicDataParams = {
    modelId: string;
    query: string | null;
};

export const useLoadDynamicData = ({ modelId, query }: UseLoadDynamicDataParams) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<JSON[] | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const apolloClient = useApolloClient();

    useEffect(() => {
        if (!modelId || !query) {
            return;
        }

        setData(null);
        setError(null);
        setLoading(true);

        const execute = async () => {
            try {
                const listQuery = await apolloClient.query({
                    query: RUN_QUERY,
                    variables: { query }
                });
                const newData = get(listQuery, `data.runQuery.data.data.result.data`, null);

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
    }, [modelId, query]);

    // To prevent setting state on unmounted component
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { data, error, loading };
};
