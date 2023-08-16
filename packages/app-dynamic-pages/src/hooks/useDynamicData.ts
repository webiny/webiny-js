import { useEffect, useState, useRef } from "react";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import { useApolloClient } from "@apollo/react-hooks";

import { useIsDynamicElement } from "~/hooks/useIsDynamicElement";
import { getChildrenPaths } from "~/utils/getChildrenPaths";
import { GET_DYNAMIC_PAGE_DATA } from "~/graphql";
import { Filter, Sort, PbElement } from "~/types";

export const usePaths = (paths?: string[]) => {
    const [prevPaths, setPrevPaths] = useState<string[]>([]);

    useEffect(() => {
        if (paths?.length && !isEqual(prevPaths.sort(), paths.sort())) {
            setPrevPaths(paths);
        }
    }, [paths]);

    return prevPaths;
};

// Loads dynamic page data for website from "read" CMS endpoint.
export const useDynamicData = (element?: PbElement) => {
    const isDynamic = useIsDynamicElement(element);
    const paths = usePaths(isDynamic ? getChildrenPaths(element?.elements) : undefined);
    const { modelId, filter, sortRules: sort, limit } = element?.data?.dynamicSource || {};

    const { data, loading, error } = useLoadDynamicData({
        modelId,
        paths,
        filter,
        sort,
        limit
    });

    return { data, loading, error };
};

// Loads one dynamic page data entry for editors (page editor, template editor) from "preview" CMS endpoint.
export const useDynamicDataForEditor = (
    element?: PbElement,
    templateWhereField?: Record<string, string>
) => {
    const isDynamic = useIsDynamicElement(element);
    const paths = usePaths(isDynamic ? getChildrenPaths(element?.elements) : undefined);
    const { modelId, filter, sortRules: sort } = element?.data?.dynamicSource || {};

    const { data, loading, error } = useLoadDynamicData({
        modelId,
        paths,
        filter,
        sort,
        limit: 1,
        ...(templateWhereField ? { where: templateWhereField } : {}),
        isPreviewEndpoint: true
    });

    return { data: data?.[0], loading, error };
};

type UseLoadDynamicDataParams = {
    modelId: string;
    paths?: string[];
    filter?: Filter;
    sort?: Sort[];
    limit?: number;
    where?: {
        entryId?: string;
    };
    isPreviewEndpoint?: boolean;
};

export const useLoadDynamicData = ({
    modelId,
    paths,
    filter,
    sort,
    limit,
    where,
    isPreviewEndpoint
}: UseLoadDynamicDataParams) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<JSON[] | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const apolloClient = useApolloClient();

    useEffect(() => {
        if (!modelId || !paths) {
            return;
        }

        setData(null);
        setError(null);
        setLoading(true);

        const execute = async () => {
            try {
                const listQuery = await apolloClient.query({
                    query: GET_DYNAMIC_PAGE_DATA,
                    variables: { modelId, paths, filter, sort, limit, where, isPreviewEndpoint }
                });

                const newData = get(
                    listQuery,
                    `data.getDynamicPageData.data.data.result.data`,
                    null
                );

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
    }, [modelId, paths, filter, sort, limit, where, isPreviewEndpoint]);

    // To prevent setting state on unmounted component.
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { data, error, loading };
};
