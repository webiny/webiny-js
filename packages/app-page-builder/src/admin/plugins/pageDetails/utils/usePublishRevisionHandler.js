// @flow
import React from "react";
import { set } from "dot-prop-immutable";
import { useApolloClient } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    publishRevision as publishRevisionGql,
    getPage
} from "@webiny/app-page-builder/admin/graphql/pages";

export function usePublishRevisionHandler({ page }) {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const publishRevision = async revision => {
        const { data: res } = await client.mutate({
            mutation: publishRevisionGql,
            variables: { id: revision.id },
            refetchQueries: ["PbListPages"],
            update: (cache, { data }) => {
                // Don't do anything if there was an error during publishing!
                if (data.pageBuilder.publishRevision.error) {
                    return;
                }

                const getPageQuery = getPage();

                // Update revisions
                const pageFromCache = cache.readQuery({
                    query: getPageQuery,
                    variables: { id: page.id }
                });

                page.revisions.forEach(r => {
                    // Update published/locked fields on the revision that was just published.
                    if (r.id === revision.id) {
                        r.published = true;
                        r.locked = true;
                        return;
                    }

                    // Unpublish other published revisions
                    if (r.published) {
                        r.published = false;
                    }
                });

                // Write our data back to the cache.
                cache.writeQuery({
                    query: getPageQuery,
                    data: set(pageFromCache, "pageBuilder.page.data", page)
                });
            }
        });

        const { error } = res.pageBuilder.publishRevision;
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
