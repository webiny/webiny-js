import { useCallback, useEffect } from "react";
import get from "lodash/get";
import merge from "lodash/merge";
import { useApolloClient } from "@apollo/react-hooks";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { PUBLISH_PAGE, LIST_PAGES } from "~/admin/graphql/pages";

export const DefaultOnPagePublish = () => {
    const { onPagePublish } = useAdminPageBuilder();
    const client = useApolloClient();

    const handlePublishPage = useCallback(async revision => {
        const response = await client.mutate({
            mutation: PUBLISH_PAGE,
            variables: { id: revision.id },
            refetchQueries: [{ query: LIST_PAGES }]
        });

        const { error, data } = get(response, "data.pageBuilder.publishPage");
        return {
            error,
            data
        };
    }, []);

    useEffect(() => {
        return onPagePublish(next => async params => {
            const result = await next(params);

            const { error, data } = await handlePublishPage(result.page);

            return { ...params, page: merge(params.page, result.page, data), error };
        });
    }, []);

    return null;
};
