import { useQuery } from "~/admin/hooks";
import { LIST_CONTENT_MODEL_GROUPS } from "~/admin/views/contentModelGroups/graphql";
import { CmsGroup } from "@webiny/app-headless-cms-common/types";

export const useGroupsQuery = () => {
    const { data, loading, error: apolloError } = useQuery(LIST_CONTENT_MODEL_GROUPS);

    const groups: CmsGroup[] | null = data?.listContentModelGroups?.data || null;
    const error = data?.listContentModelGroups?.error || apolloError;

    return {
        groups,
        error,
        loading
    };
};
