import { useEffect, useState, useRef } from "react";
import { useCms } from "@webiny/app-headless-cms/index";
import { getNestingByPath } from "~/utils/getNestingByPath";
import { CmsModelField } from "@webiny/app-headless-cms/types";

export const useDynamicField = (modelId: string, path: string) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<CmsModelField | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);
    const { readApolloClient } = useCms();

    useEffect(() => {
        setData(null);
        setError(null);
        setLoading(true);

        const execute = async () => {
            try {
                const nesting = await getNestingByPath(readApolloClient, modelId, path);
                if (!isMounted.current) {
                    return;
                }
                const [{ selectedField }] = nesting.slice(-1);
                const isBasicField =
                    selectedField?.type !== "dynamicZone" &&
                    selectedField?.type !== "ref" &&
                    selectedField?.type !== "object";

                if (selectedField && isBasicField) {
                    setData(selectedField);
                } else {
                    setError(new Error("Latest path item is not basic field"));
                }
                setLoading(false);
            } catch (err) {
                if (!isMounted.current) {
                    return;
                }
                console.log("Error while getting field by path:", err.message);
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
