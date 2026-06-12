import React from "react";
import { observer } from "mobx-react-lite";
import { Button, useToast } from "@webiny/admin-ui";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "../ContentEntryFormPresenterProvider.js";
import { useContentEntriesPresenter } from "../ContentEntriesPresenterProvider.js";

export const SaveContentButton = observer(() => {
    const { canEdit } = usePermission();
    const presenter = useContentEntryFormPresenter();
    const listPresenter = useContentEntriesPresenter();
    const { showSuccessToast } = useToast();

    if (
        !presenter.vm.canSave ||
        (presenter.vm.entry && !canEdit(presenter.vm.entry, "cms.contentEntry"))
    ) {
        return null;
    }

    const handleSave = async () => {
        const isNew = presenter.vm.isNewEntry;
        const saved = await presenter.saveRevision();
        if (saved) {
            if (isNew && presenter.vm.entry) {
                listPresenter.selectEntry(presenter.vm.entry.id);
            }
            showSuccessToast({
                title: `${presenter.vm.entry?.meta?.title || "Entry"} saved successfully!`
            });
        }
    };

    return (
        <Button
            variant={"secondary"}
            data-testid={"cms-content-save-content-button"}
            onClick={handleSave}
            text={"Save"}
        />
    );
});
