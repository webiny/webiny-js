import { useCallback } from "react";
import { useConfirmationDialog } from "@webiny/app-admin";
import { useRevision } from "~/admin/views/contentEntries/ContentEntry/useRevision";
import { CmsContentEntry } from "~/types";

interface UseChangeEntryStatusParams {
    entry: CmsContentEntry;
}

export const useChangeEntryStatus = ({ entry }: UseChangeEntryStatusParams) => {
    const { unpublishRevision, publishRevision } = useRevision({
        revision: {
            id: entry.id,
            meta: {
                version: entry.meta.version
            }
        }
    });

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
                await publishRevision(entry.id);
            }),
        [entry.id]
    );

    const openDialogUnpublishEntry = useCallback(
        () =>
            showUnpublishConfirmation(async () => {
                await unpublishRevision(entry.id);
            }),
        [entry.id]
    );

    return {
        openDialogPublishEntry,
        openDialogUnpublishEntry
    };
};
