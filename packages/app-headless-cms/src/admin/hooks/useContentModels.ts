import * as GQL from "~/admin/viewsGraphql";
import { useQuery } from "~/admin/hooks/index";
import { ListCmsModelsQueryResponse } from "~/admin/viewsGraphql";
import { useMemo } from "react";
import { CmsModel } from "~/types";

export const useContentModels = () => {
    const {
        data,
        loading,
        error: apolloError
    } = useQuery<ListCmsModelsQueryResponse>(GQL.LIST_CONTENT_MODELS);

    const models = useMemo<CmsModel[]>(() => {
        return data?.listContentModels?.data || [];
    }, [data]);

    const error = useMemo(() => {
        if (!!apolloError) {
            return apolloError.message;
        }
        return data?.listContentModels?.error?.message || null;
    }, [apolloError]);

    return {
        models,
        loading,
        error
    };
};
