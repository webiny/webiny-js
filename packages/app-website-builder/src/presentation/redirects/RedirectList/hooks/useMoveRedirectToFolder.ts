import { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { useContainer } from "@webiny/app";
import { MoveRedirectUseCase } from "~/features/redirects/moveRedirect/abstractions.js";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";

export function useMoveRedirectToFolder(redirect: Pick<RedirectDto, "id" | "title" | "location">) {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useMoveToFolderDialog();
    const container = useContainer();
    const moveRedirectUseCase = container.resolve(MoveRedirectUseCase);

    return useCallback(() => {
        showDialog({
            title: "Move redirect to a new location",
            message: "Select a new location for this redirect:",
            loadingLabel: "Moving redirect...",
            acceptLabel: "Move redirect",
            focusedFolderId: redirect.location.folderId,
            async onAccept({ folder }) {
                await moveRedirectUseCase.execute({
                    id: redirect.id,
                    folderId: folder.id
                });
                showSnackbar(
                    `Redirect "${redirect.title}" was successfully moved to folder "${folder.label}"!`
                );
            }
        });
    }, [redirect.id]);
}
