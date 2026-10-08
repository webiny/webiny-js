import React from "react";
import { ReactComponent as DuplicateIcon } from "@webiny/icons/library_add.svg";
import { useToast } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useEntry, usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";

export const DuplicateEntry = () => {
    const { entry } = useEntry();
    const toast = useToast();
    const { canCreate } = usePermission();
    const presenter = useContentEntriesPresenter();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    const handleDuplicate = async () => {
        const result = await presenter.duplicateEntry(entry);
        if (!result) {
            return;
        }
        if (result.error) {
            toast.showWarningToast({
                title: `Could not duplicate ${entry.meta.title}.`,
                description: result.error.message
            });
            return;
        }
        toast.showSuccessToast({
            title: `${entry.meta.title} was duplicated successfully!`
        });
    };

    if (!canCreate("cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<DuplicateIcon />}
            label={"Duplicate"}
            onAction={handleDuplicate}
            data-testid={"aco.actions.entry.duplicate"}
        />
    );
};
