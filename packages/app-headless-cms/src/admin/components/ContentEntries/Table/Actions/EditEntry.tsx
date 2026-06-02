import React from "react";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { useEntry, usePermission } from "~/admin/hooks/index.js";

export const EditEntry = () => {
    const { entry } = useEntry();
    const { canEdit } = usePermission();
    const presenter = useContentEntriesPresenter();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Edit />}
            label={"Edit"}
            onAction={() => presenter.selectEntry(entry.id)}
            data-testid={"aco.actions.entry.edit"}
        />
    );
};
