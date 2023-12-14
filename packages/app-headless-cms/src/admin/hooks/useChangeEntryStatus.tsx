import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useRecords } from "@webiny/app-aco";
import { useCms, useContentEntry } from "~/admin/hooks/index";
import { CmsContentEntry } from "~/types";

interface UseChangeEntryStatusParams {
    entry: CmsContentEntry;
}

export const useChangeEntryStatus = ({ entry }: UseChangeEntryStatusParams) => {
    const { publishEntryRevision, unpublishEntryRevision } = useCms();
    const { contentModel } = useContentEntry();
    const { showSnackbar } = useSnackbar();
    const { updateRecordInCache } = useRecords();

    const { showConfirmation: showPublishConfirmation } = useConfirmationDialog({
        title: "Publish CMS Entry",
        message: `You are about to publish the "${entry.meta.title}" CMS entry. Are you sure you want to continue?`
    });

    const { showConfirmation: showUnpublishConfirmation } = useConfirmationDialog({
        title: "Unpublish CMS Entry",
        message: `You are about to unpublish the "${entry.meta.title}" CMS entry. Are you sure you want to continue?`
    });

    const openDialogPublishEntry = useCallback(
        () =>
            showPublishConfirmation(async () => {
                const response = await publishEntryRevision({
                    model: contentModel,
                    entry,
                    id: entry.id
                });

                const { error, entry: entryResult } = response;
                if (error) {
                    showSnackbar(error.message);
                    return;
                }

                updateRecordInCache(entryResult);

                showSnackbar(
                    <span>
                        Successfully published revision{" "}
                        <strong>#{response.entry!.meta.version}</strong>!
                    </span>
                );
            }),
        [entry.id, contentModel]
    );

    const openDialogUnpublishEntry = useCallback(
        () =>
            showUnpublishConfirmation(async () => {
                const response = await unpublishEntryRevision({
                    model: contentModel,
                    entry,
                    id: entry.id
                });

                const { error, entry: entryResult } = response;

                if (error) {
                    showSnackbar(error.message);
                    return;
                }

                updateRecordInCache(entryResult);

                showSnackbar(
                    <span>
                        Successfully unpublished revision <strong>#{entry.meta.version}</strong>!
                    </span>
                );
            }),
        [entry.id, contentModel]
    );

    return {
        openDialogPublishEntry,
        openDialogUnpublishEntry
    };
};
