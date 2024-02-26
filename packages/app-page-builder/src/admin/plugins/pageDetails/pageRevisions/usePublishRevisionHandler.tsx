import React from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { useRecords } from "@webiny/app-aco";
import { PbPageDataItem } from "~/types";

export function usePublishRevisionHandler() {
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();
    const { getRecord } = useRecords();

    const publishRevision = async (revision: Pick<PbPageDataItem, "id" | "version" | "pid">) => {
        const response = await pageBuilder.publishPage(revision, {
            client: pageBuilder.client
        });
        if (response) {
            const { error } = response;
            if (error) {
                return showSnackbar(error.message);
            }

            // Sync ACO record - retrieve the most updated record from network
            await getRecord(revision.pid);

            showSnackbar(
                <span>
                    Successfully published revision <strong>#{revision.version}</strong>!
                </span>
            );
        }
    };

    const unpublishRevision = async (
        revision: Pick<PbPageDataItem, "id" | "version" | "pid">
    ): Promise<void> => {
        const response = await pageBuilder.unpublishPage(revision, {
            client: pageBuilder.client
        });
        if (response) {
            const { error } = response;
            if (error) {
                return showSnackbar(error.message);
            }

            // Sync ACO record - retrieve the most updated record from network
            await getRecord(revision.pid);

            showSnackbar(
                <span>
                    Successfully unpublished revision <strong>#{revision.version}</strong>!
                </span>
            );
        }
    };

    return {
        publishRevision,
        unpublishRevision
    };
}
