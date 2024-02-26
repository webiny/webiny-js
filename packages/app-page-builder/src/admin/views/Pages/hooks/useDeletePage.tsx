import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { PbPageData } from "~/types";
import { useConfirmationDialog, useDialog, useSnackbar } from "@webiny/app-admin";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { useRecords } from "@webiny/app-aco";
import { parseIdentifier } from "@webiny/utils";

const t = i18n.ns("app-headless-cms/app-page-builder/dialogs/dialog-delete-page");

interface UseDeletePageParams {
    page: Pick<PbPageData, "id" | "title">;
    onDelete?: () => void;
}

export const useDeletePage = ({ page, onDelete }: UseDeletePageParams) => {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();
    const { deletePage, client } = useAdminPageBuilder();
    const { getRecord } = useRecords();

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
                const { id } = parseIdentifier(page.id);
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

                // Sync ACO record - retrieve the most updated record from network
                await getRecord(id);

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
