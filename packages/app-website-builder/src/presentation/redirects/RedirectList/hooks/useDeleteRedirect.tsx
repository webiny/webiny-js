import React, { useCallback } from "react";
import { Text } from "@webiny/admin-ui";
import { useNamedConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { DeleteRedirectUseCase } from "~/features/redirects/deleteRedirect/abstractions.js";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";

interface UseDeleteRedirectParams {
    redirect: Pick<RedirectDto, "id" | "title">;
    onDelete?: () => void;
}

export const useDeleteRedirect = ({ redirect, onDelete }: UseDeleteRedirectParams) => {
    const container = useContainer();
    const deleteRedirectUseCase = container.resolve(DeleteRedirectUseCase);
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useNamedConfirmationDialog({
        title: "Delete redirect",
        loading: "Deleting redirect...",
        message: (
            <Text>
                You are about to permanently delete redirect <strong>{redirect.title}</strong>. Are
                you sure you want to continue?
            </Text>
        )
    });

    const openDeleteDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await deleteRedirectUseCase.execute({ id: redirect.id });
                    showSnackbar(`${redirect.title} was deleted successfully!`);
                    if (onDelete) {
                        onDelete();
                    }
                } catch (ex: any) {
                    showSnackbar(ex.message || `Error while deleting ${redirect.title}`);
                }
            }),
        [redirect.id]
    );

    return { openDeleteDialog };
};
