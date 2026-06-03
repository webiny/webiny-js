import React, { useCallback } from "react";
import { ReactComponent as Move } from "@webiny/icons/exit_to_app.svg";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { useToast } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useEntry } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";

export const MoveEntry = () => {
    const { entry } = useEntry();
    const presenter = useContentEntriesPresenter();
    const toast = useToast();

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
                const success = await presenter.moveEntry(entry.id, folder.id);
                if (success) {
                    toast.showSuccessToast({
                        title: `Entry "${entry.meta?.title || "unknown"}" was moved to "${folder.label}".`
                    });
                }
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
