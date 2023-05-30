import { useEffect, useState, useRef } from "react";
import { useCms } from "@webiny/app-headless-cms/index";
import { composeDynamicApi, Filter, Sort } from "~/utils/composeDynamicApi";

type UseLoadDynamicDataQueryParams = {
    modelId: string;
    paths?: string[];
    filter?: Filter;
    sort?: Sort[];
    limit?: number;
    templateWhereField?: Record<string, string | undefined>;
};

export const useDynamicDataQuery = ({
    modelId,
    filter,
    sort,
    limit,
    paths,
    templateWhereField
}: UseLoadDynamicDataQueryParams) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const { readApolloClient } = useCms();

    useEffect(() => {
        if (!modelId || !paths) {
            return;
        }

        setData(null);
        setError(null);
        setLoading(true);

        const execute = async () => {
            try {
                const query = await composeDynamicApi({
                    readApolloClient,
                    paths,
                    modelId,
                    filter,
                    sort,
                    limit,
                    templateWhereField
                });

                setData(query);
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
