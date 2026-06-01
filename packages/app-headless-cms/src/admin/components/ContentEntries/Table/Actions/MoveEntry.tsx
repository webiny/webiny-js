import React, { useCallback } from "react";
import { ReactComponent as Move } from "@webiny/icons/exit_to_app.svg";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { useSnackbar, useFeature } from "@webiny/app-admin";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useEntry, useModel } from "~/admin/hooks/index.js";
import { MoveEntryFeature } from "~/features/contentEntry/moveEntry/feature.js";
import type { IMoveEntryUseCase } from "~/features/contentEntry/moveEntry/abstractions.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";

export const MoveEntry = () => {
    const { entry } = useEntry();
    const { model } = useModel();
    const { useCase: moveEntryUseCase } = useFeature(MoveEntryFeature) as {
        useCase: IMoveEntryUseCase;
    };
    const { actions } = useContentEntriesPresenter();
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useMoveToFolderDialog();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    const moveContentEntry = useCallback(() => {
        showDialog({
            title: "Move entry to a new location",
            message: "Select a new location for this entry:",
            loadingLabel: "Moving entry...",
            acceptLabel: "Move entry",
            focusedFolderId: entry.wbyAco_location?.folderId,
            async onAccept({ folder }) {
                await moveEntryUseCase.execute({
                    model,
                    id: entry.id,
                    folderId: folder.id
                });
                await actions.refresh();
                showSnackbar(
                    `Entry "${entry.meta?.title || "unknown"}" was moved to "${folder.label}".`
                );
            }
        });
    }, [entry.id]);

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={moveContentEntry}
            data-testid={"aco.actions.entry.move"}
        />
    );
};
