import { useEffect } from "react";
import get from "lodash/get";
import { merge, set } from "dot-prop-immutable";
import cloneDeep from "lodash/cloneDeep";
import { MutationUpdaterFn } from "apollo-client";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { GET_PAGE, UNPUBLISH_PAGE } from "~/admin/graphql/pages";
import { UnpublishPageOptions } from "~/admin/contexts/AdminPageBuilder";
import { PageStatus, PbPageData } from "~/types";

const getUpdateCache =
    (page: Pick<PbPageData, "id">): MutationUpdaterFn<any> =>
    (cache, { data }) => {
        // Don't do anything if there was an error during unpublishing!
        if (data.pageBuilder.unpublishPage.error) {
            return;
        }

        // Update revisions
        let pageFromCache;
        try {
            pageFromCache = cloneDeep(
                cache.readQuery({
                    query: GET_PAGE,
                    variables: { id: page.id }
                })
            );
        } catch {
            // This means page could not be found in the cache. Exiting...
            return;
        }

        const revisions = get(pageFromCache, "pageBuilder.getPage.data.revisions", []);
        revisions.forEach((r: any) => {
            // Update published/locked fields on the revision that was just published.
            if (r.id === page.id) {
                r.status = PageStatus.UNPUBLISHED;
                r.locked = true;
                return;
            }
        });

        // Write our data back to the cache.
        cache.writeQuery({
            query: GET_PAGE,
            data: set(pageFromCache, "pageBuilder.getPage.data.revisions", revisions)
        });
    };

export const DefaultOnPageUnpublish = () => {
    const { onPageUnpublish } = useAdminPageBuilder();

    const handleUnpublishPage = async (
        revision: Pick<PbPageData, "id" | "version">,
        options: UnpublishPageOptions
    ) => {
        /**
         * Error is due to options.mutationOptions
         */
        // @ts-expect-error
        const response = await options.client.mutate({
            mutation: UNPUBLISH_PAGE,
            variables: { id: revision.id },
            update: getUpdateCache(revision),
            ...get(options, "mutationOptions", {})
        });

        const { error, data } = get(response, "data.pageBuilder.unpublishPage");

        return {
            error,
            data
        };
    };

    useEffect(() => {
        return onPageUnpublish(next => async params => {
            const result = await next(params);

            /**
             * If there is error in one of previous hooks. Don't execute the action and just return the result.
             */
            if (result.error) {
                return result;
            }

            const { error, data } = await handleUnpublishPage(result.page, result.options);

            return { ...merge(result, "page", data), error };
        });
    }, []);

    return null;
};
