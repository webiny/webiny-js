import { useEffect, useState, useRef } from "react";

import { useCms } from "@webiny/app-headless-cms";
import { useModelById } from "@webiny/app-headless-cms/admin/hooks";

import { getNestingByPath, NestingItem } from "~/utils/getNestingByPath";

export const useDynamicFieldNesting = (modelId: string, path: string) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<NestingItem[] | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const { apolloClient } = useCms();
    const { model } = useModelById(modelId);

    useEffect(() => {
        if (!model) {
            return;
        }

        setData(null);
        setError(null);
        setLoading(true);

        const execute = async () => {
            try {
                const nesting = await getNestingByPath(apolloClient, model, path);

                if (!isMounted.current) {
                    return;
                }
                setData(nesting);
                setLoading(false);
            } catch (err) {
                if (!isMounted.current) {
                    return;
                }
                console.log("Error while getting nesting by path:", err.message);
                setError(err);
                setLoading(false);
            }
        };

        execute();
    }, [model, path]);

    // To prevent setting state on unmounted component.
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { data, error, loading };
};
