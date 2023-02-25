import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { PbPageData } from "~/types";
import { useConfirmationDialog, useDialog, useSnackbar } from "@webiny/app-admin";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import * as GQLCache from "~/admin/views/Pages/cache";

const t = i18n.ns("app-headless-cms/app-page-builder/dialogs/dialog-delete-page");

interface UseDeletePageParams {
    page: Pick<PbPageData, "id" | "title">;
    onDelete?: () => void;
}

export const useDeletePage = ({ page, onDelete }: UseDeletePageParams) => {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();
    const { deletePage, client } = useAdminPageBuilder();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete page`,
        message: (
            <p>
                {t`You are about to delete the entire page and all of its revisions!`}
                <br />
                {t`Are you sure you want to permanently delete the page {title}?`({
                    title: <strong>{page.title}</strong>
                })}
            </p>
        ),
        dataTestId: "pb-page-details-header-delete-dialog"
    });

    const openDialogDeletePage = useCallback(
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

                showSnackbar(
                    t`The page "{title}" was deleted successfully.`({
                        title: `${
                            page.title.length > 20
                                ? page.title.slice(0, 20).concat("...")
                                : page.title
                        }`
                    })
                );

                if (typeof onDelete === "function") {
                    onDelete();
                }
            }),
        [page]
    );

    return {
        openDialogDeletePage
    };
};
