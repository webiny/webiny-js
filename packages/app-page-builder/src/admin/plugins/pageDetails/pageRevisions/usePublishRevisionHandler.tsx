import React from "react";
import { set } from "dot-prop-immutable";
import { useApolloClient } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { PUBLISH_PAGE, GET_PAGE } from "@webiny/app-page-builder/admin/graphql/pages";

export function usePublishRevisionHandler({ page }) {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const publishRevision = async revision => {
        const { data: res } = await client.mutate({
            mutation: PUBLISH_PAGE,
            variables: { id: revision.id },
            update: (cache, { data }) => {
                // Don't do anything if there was an error during publishing!
                if (data.pageBuilder.publishPage.error) {
                    return;
                }

                // Update revisions
                const pageFromCache = cache.readQuery({
                    query: GET_PAGE,
                    variables: { id: page.id }
                });

                page.revisions.forEach(r => {
                    // Update published/locked fields on the revision that was just published.
                    if (r.id === revision.id) {
                        r.status = "published";
                        r.locked = true;
                        return;
                    }

                    // Unpublish other published revisions
                    if (r.status === "published") {
                        r.status = "unpublished";
                    }
                });

                // Write our data back to the cache.
                cache.writeQuery({
                    query: GET_PAGE,
                    data: set(pageFromCache, "pageBuilder.getPage.data", page)
                });
            }
        });

        const { error } = res.pageBuilder.publishPage;
        if (error) {
            return showSnackbar(error.message);
        }

        showSnackbar(
            <span>
                Successfully published revision <strong>#{revision.version}</strong>!
            </span>
        );
    };

    return {
        publishRevision
    };
}
