import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { UNPUBLISH_PAGE } from "~/admin/graphql/pages";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { PbPageDataItem } from "~/types";

export function usePublishRevisionHandler() {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();

    const publishRevision = async (revision: Pick<PbPageDataItem, "id" | "version">) => {
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
        revision: Pick<PbPageDataItem, "id" | "version">
    ): Promise<void> => {
        const { data: res } = await client.mutate({
            mutation: UNPUBLISH_PAGE,
            variables: { id: revision.id },
            update: (cache, { data }) => {
                // Don't do anything if there was an error during publishing!
                if (data.pageBuilder.unpublishPage.error) {
                    return;
                }
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
