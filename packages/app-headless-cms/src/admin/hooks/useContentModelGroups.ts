import * as GQL from "~/admin/viewsGraphql";
import { useQuery } from "~/admin/hooks/index";
import { ListMenuCmsGroupsQueryResponse } from "~/admin/viewsGraphql";
import { useMemo } from "react";
import { CmsGroup } from "~/types";

export const useContentModelGroups = () => {
    const {
        data,
        loading,
        error: apolloError
    } = useQuery<ListMenuCmsGroupsQueryResponse>(GQL.LIST_MENU_CONTENT_GROUPS_MODELS);

    const groups = useMemo<CmsGroup[]>(() => {
        return data?.listContentModelGroups?.data || [];
    }, [data]);

    const error = useMemo(() => {
        if (!!apolloError) {
            return apolloError.message;
        }
        return data?.listContentModelGroups?.error?.message || null;
    }, [apolloError]);

    return {
        groups,
        loading,
        error
    };
};
