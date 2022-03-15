import React from "react";
import { set } from "dot-prop-immutable";
import { useApolloClient } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { UNPUBLISH_PAGE, GET_PAGE } from "~/admin/graphql/pages";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { PbPageData } from "~/types";

interface UsePublishRevisionHandlerParams {
    page: PbPageData;
}
export function usePublishRevisionHandler({ page }: UsePublishRevisionHandlerParams) {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();

    const publishRevision = async (revision: Pick<PbPageData, "id" | "version">) => {
        const response = await pageBuilder.publishPage(revision, {
            client: pageBuilder.client
        });
        if (response) {
            const { error } = response;
            if (error) {
                return showSnackbar(error.message);
            }

            showSnackbar(
                <span>
                    Successfully published revision <strong>#{revision.version}</strong>!
                </span>
            );
        }
    };

    const unpublishRevision = async (
        revision: Pick<PbPageData, "id" | "version">
    ): Promise<void> => {
        const { data: res } = await client.mutate({
            mutation: UNPUBLISH_PAGE,
            variables: { id: revision.id },
            update: (cache, { data }) => {
                // Don't do anything if there was an error during publishing!
                if (data.pageBuilder.unpublishPage.error) {
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
                        r.status = "unpublished";
                        r.locked = true;
                        return;
                    }
                });

                // Write our data back to the cache.
                cache.writeQuery({
                    query: GET_PAGE,
                    data: set(pageFromCache, "pageBuilder.getPage.data", page)
                });
            }
        });

        const { error } = res.pageBuilder.unpublishPage;
        if (error) {
            return showSnackbar(error.message);
        }

        showSnackbar(
            <span>
                Successfully unpublished revision <strong>#{revision.version}</strong>!
            </span>
        );
    };

    return {
        publishRevision,
        unpublishRevision
    };
}
