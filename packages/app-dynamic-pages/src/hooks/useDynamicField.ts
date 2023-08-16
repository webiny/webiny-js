import { useEffect, useState, useRef } from "react";

import { useCms } from "@webiny/app-headless-cms";
import { CmsModelField } from "@webiny/app-headless-cms/types";
import { useModelById } from "@webiny/app-headless-cms/admin/hooks";

import { getNestingByPath } from "~/utils/getNestingByPath";

export const useDynamicField = (modelId: string, path: string) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<CmsModelField | null>(null);
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
                const [{ selectedField }] = nesting.slice(-1);
                const { type: fieldsType } = selectedField || {};
                const isBasicField =
                    fieldsType !== "dynamicZone" && fieldsType !== "ref" && fieldsType !== "object";

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
    }, [model, path]);

    // To prevent setting state on unmounted component.
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { data, error, loading };
};
