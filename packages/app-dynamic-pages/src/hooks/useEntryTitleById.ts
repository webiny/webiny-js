import { useEffect, useMemo, useState, useRef } from "react";

import { parseIdentifier } from "@webiny/utils";
import { useCms } from "@webiny/app-headless-cms";
import { createReadQuery, CmsEntryGetQueryResponse } from "@webiny/app-headless-cms-common";
import { CmsModel } from "@webiny/app-headless-cms/types";

export const useEntryTitleById = (model?: CmsModel, revisionId?: string) => {
    const isMounted = useRef(true);
    const [data, setData] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const { apolloClient } = useCms();

    const READ_CONTENT = useMemo(() => {
        if (!model) {
            return;
        }

        return createReadQuery(model);
    }, [model]);

    useEffect(() => {
        if (!READ_CONTENT || !revisionId) {
            return;
        }

        setData(null);
        setError(null);
        setLoading(true);

        const execute = async () => {
            try {
                const entryId = parseIdentifier(revisionId).id;
                const getQuery = await apolloClient.query<CmsEntryGetQueryResponse>({
                    query: READ_CONTENT,
                    variables: { entryId }
                });

                if (!isMounted.current) {
                    return;
                }
                setData(getQuery.data.content.data?.meta.title || null);
                setLoading(false);
            } catch (err) {
                if (!isMounted.current) {
                    return;
                }
                console.log("Error while getting entry title by id:", err.message);
                setError(err);
                setLoading(false);
            }
        };

        execute();
    }, [READ_CONTENT, revisionId]);

    // To prevent setting state on unmounted component.
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return { data, error, loading };
};
