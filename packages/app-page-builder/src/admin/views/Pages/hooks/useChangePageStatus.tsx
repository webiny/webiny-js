import { useCallback } from "react";
import { useConfirmationDialog } from "@webiny/app-admin";
import { usePublishRevisionHandler } from "~/admin/plugins/pageDetails/pageRevisions/usePublishRevisionHandler";
import { PbPageTableItem } from "~/types";

interface UseChangePageStatusParams {
    page: PbPageTableItem;
}

export const useChangePageStatus = ({ page }: UseChangePageStatusParams) => {
    const { publishRevision, unpublishRevision } = usePublishRevisionHandler();

    const { showConfirmation: showPublishConfirmation } = useConfirmationDialog({
        title: "Publish page",
        message: `You are about to publish the "${page.data.title}" page. Are you sure you want to continue?`
    });

    const { showConfirmation: showUnpublishConfirmation } = useConfirmationDialog({
        title: "Unpublish page",
        message: `You are about to unpublish the "${page.data.title}" page. Are you sure you want to continue?`
    });

    const openDialogPublishPage = useCallback(
        () =>
            showPublishConfirmation(async () => {
                await publishRevision(page.data);
            }),
        [page]
    );

    const openDialogUnpublishPage = useCallback(
        () =>
            showUnpublishConfirmation(async () => {
                await unpublishRevision(page.data);
            }),
        [page]
    );

    return {
        openDialogPublishPage,
        openDialogUnpublishPage
    };
};
