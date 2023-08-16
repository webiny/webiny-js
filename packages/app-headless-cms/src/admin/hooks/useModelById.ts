import { useMemo } from "react";

import * as GQL from "~/admin/viewsGraphql";
import { useQuery } from "~/admin/hooks/index";
import { GetCmsModelQueryResponse } from "~/admin/viewsGraphql";
import { CmsModel } from "~/types";

export const useModelById = (modelId?: string) => {
    const {
        data,
        loading,
        error: apolloError,
        refetch
    } = useQuery<GetCmsModelQueryResponse>(GQL.GET_CONTENT_MODEL, {
        variables: { modelId },
        skip: !modelId
    });

    const model = useMemo<CmsModel | undefined>(() => {
        return data?.getContentModel?.data;
    }, [data]);

    const error = useMemo(() => {
        if (!!apolloError) {
            return apolloError.message;
        }
        return data?.getContentModel?.error?.message || null;
    }, [apolloError]);

    return {
        model,
        loading,
        error,
        refresh: refetch
    };
};
