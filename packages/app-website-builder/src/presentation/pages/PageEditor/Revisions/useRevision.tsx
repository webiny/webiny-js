import React from "react";
import type { PageRevision } from "~/domain/PageRevision/index.js";
import {
    usePublishPage,
    useUnpublishPage,
    useCreatePageRevisionFrom,
    useDeletePageRevision
} from "~/features/pages/index.js";
import { useCallback } from "react";
import { Text, useToast } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { Routes } from "~/routes.js";
import { useRouter } from "@webiny/app";
import { usePageEditorDrawer } from "./usePageEditorDrawer.js";

export interface UseRevisionProps {
    revision: PageRevision;
}

export const useRevision = (props: UseRevisionProps) => {
    const { revision } = props;

    const { goToRoute } = useRouter();
    const { openRevisionList } = usePageEditorDrawer();
    const { showDialog } = useDialogs();
    const { showSuccessToast, showWarningToast } = useToast();

    const { createPageRevisionFrom } = useCreatePageRevisionFrom();
    const { deletePageRevision } = useDeletePageRevision();
    const { publishPage } = usePublishPage();
    const { unpublishPage } = useUnpublishPage();

    const createRevision = useCallback(async () => {
        await createPageRevisionFrom({
            id: revision.id
        });
    }, [revision.id]);

    const deleteRevision = useCallback(() => {
        showDialog({
            title: "Delete revision",
            icon: <DeleteIcon />,
            content: (
                <Text>
                    {`You are about to delete revision #${revision.version}. This cannot be undone. Are you sure you want to continue?`}
                </Text>
            ),
            acceptLabel: "Yes, delete this revision!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                try {
                    await deletePageRevision({
                        id: revision.id
                    });

                    showSuccessToast({
                        title: `Revision #${revision.version} was deleted successfully!`
                    });
                } catch (ex) {
                    showWarningToast({
                        title: "Could not delete the revision.",
                        description: ex.message
                    });
                }
            }
        });
    }, [revision.id, revision.version]);

    const publishRevision = useCallback(() => {
        showDialog({
            title: "Publish revision",
            icon: <PublishIcon />,
            content: (
                <Text>
                    {`You are about to publish revision #${revision.version}. Are you sure you want to continue?`}
                </Text>
            ),
            acceptLabel: "Yes, publish this revision!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                try {
                    await publishPage({
                        id: revision.id
                    });

                    showSuccessToast({
                        title: `Revision #${revision.version} was published successfully!`
                    });
                } catch (ex) {
                    showWarningToast({
                        title: "Could not publish the revision.",
                        description: ex.message
                    });
                }
            }
        });
    }, [revision.id, revision.version]);

    const unpublishRevision = useCallback(() => {
        showDialog({
            title: "Unpublish revision",
            icon: <UnpublishIcon />,
            content: (
                <Text>
                    {`You are about to unpublish revision #${revision.version}, which will take the page off the live website. Are you sure you want to continue?`}
                </Text>
            ),
            acceptLabel: "Yes, unpublish this revision!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                try {
                    await unpublishPage({
                        id: revision.id
                    });

                    showSuccessToast({
                        title: `Revision #${revision.version} was unpublished successfully!`
                    });
                } catch (ex) {
                    showWarningToast({
                        title: "Could not unpublish the revision.",
                        description: ex.message
                    });
                }
            }
        });
    }, [revision.id, revision.version]);

    const editRevision = useCallback(() => {
        // The drawer lives outside the editor, so it would stay open across the navigation.
        openRevisionList(false);

        goToRoute(Routes.Pages.Editor, {
            id: revision.id
        });
    }, [revision.id, openRevisionList]);

    return {
        createRevision,
        editRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision
    };
};
