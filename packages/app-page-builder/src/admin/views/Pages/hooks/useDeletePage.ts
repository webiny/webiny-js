import { useConfirmationDialog, useDialog, useSnackbar } from "@webiny/app-admin";
import { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { PbPageDataLink } from "~/types";
import { LinkItem } from "@webiny/app-folders/types";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/delete-page");

interface UseDeletePageParams {
    page: PbPageDataLink;
    onDeletePageSuccess: (linkItem: LinkItem) => void;
}

export const useDeletePage = ({ page, onDeletePageSuccess }: UseDeletePageParams) => {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();
    const { deletePage, client } = useAdminPageBuilder();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete page`,
        message:
            t`You are about to delete the entire page "{title}" and all of its revisions! Are you sure you want to continue?`(
                {
                    title: page.title
                }
            )
    });

    const deletePageMutation = useCallback(
        () =>
            showConfirmation(async () => {
                const [uniquePageId] = page.id.split("#");
                const id = `${uniquePageId}#0001`;
                /**
                 * Delete page using pageBuilder deletePage hook.
                 */
                const response = await deletePage(
                    { id },
                    {
                        client: client,
                        mutationOptions: {
                            update(_, { data }) {
                                if (data.pageBuilder.deletePage.error) {
                                    return;
                                }
                                // Also, delete the page from "LIST_PAGES_ cache
                                GQLCache.removePageFromListCache(client.cache, page);
                            }
                        }
                    }
                );

                if (!response) {
                    return;
                }
                const { error } = response;
                if (error) {
                    showDialog(error.message, { title: t`Could not delete page.` });
                    return;
                }

                await onDeletePageSuccess({
                    id: page.pid,
                    linkId: page.link.linkId,
                    folderId: page.link.folderId
                });

                showSnackbar(
                    t`The page "{title}" was deleted successfully.`({
                        title: `${
                            page.title.length > 20
                                ? page.title.slice(0, 20).concat("...")
                                : page.title
                        }`
                    })
                );
            }),
        [page]
    );

    return {
        deletePageMutation
    };
};
