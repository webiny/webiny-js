import { useEffect, useState, useRef } from "react";
import { useCms } from "@webiny/app-headless-cms/index";
import { getNestingByPath } from "~/utils/getNestingByPath";

export const useResolvedPath = (modelId: string, path: string) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<string | null>(null);
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
                const nesting = await getNestingByPath(readApolloClient, modelId, path);

                if (!isMounted.current) {
                    return;
                }
                const resolvedPath = nesting
                    .filter(nestingItem => !nestingItem.selectedTemplate)
                    .map(({ pathPart }) => pathPart)
                    .join(".");
                setData(resolvedPath);
                setLoading(false);
            } catch (err) {
                if (!isMounted.current) {
                    return;
                }
                console.log("Error while generating resolved path:", err.message);
                setError(err);
                setLoading(false);
            }
        };

        execute();
    }, [modelId, path]);

    // To prevent setting state on unmounted component
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { data, error, loading };
};
