import { useEffect } from "react";
import get from "lodash/get";
import { set, merge } from "dot-prop-immutable";
import cloneDeep from "lodash/cloneDeep";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { GET_PAGE, PUBLISH_PAGE } from "~/admin/graphql/pages";
import { PublishPageOptions } from "~/admin/contexts/AdminPageBuilder";
import { PageStatus } from "~/types";

const getUpdateCache =
    page =>
    (cache, { data }) => {
        // Don't do anything if there was an error during publishing!
        if (data.pageBuilder.publishPage.error) {
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
        revisions.forEach(r => {
            // Update published/locked fields on the revision that was just published.
            if (r.id === page.id) {
                r.status = PageStatus.PUBLISHED;
                r.locked = true;
                return;
            }

            // Unpublish other published revisions
            if (r.status === PageStatus.PUBLISHED) {
                r.status = PageStatus.UNPUBLISHED;
            }
        });

        // Write our data back to the cache.
        cache.writeQuery({
            query: GET_PAGE,
            data: set(pageFromCache, "pageBuilder.getPage.data.revisions", revisions)
        });
    };

export const DefaultOnPagePublish = () => {
    const { onPagePublish } = useAdminPageBuilder();

    const handlePublishPage = async (revision, options: PublishPageOptions) => {
        const response = await options.client.mutate({
            mutation: PUBLISH_PAGE,
            variables: { id: revision.id },
            update: getUpdateCache(revision),
            ...get(options, "mutationOptions", {})
        });

        const { error, data } = get(response, "data.pageBuilder.publishPage");

        return {
            error,
            data
        };
    };

    useEffect(() => {
        return onPagePublish(next => async params => {
            const result = await next(params);

            const { error, data } = await handlePublishPage(result.page, result.options);

            return { ...merge(result, "page", data), error };
        });
    }, []);

    return null;
};
