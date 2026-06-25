import React from "react";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { useEntry, usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { OptionsMenuItem } from "@webiny/app-admin";

export const EditEntry = () => {
    const { entry } = useEntry();
    const { canEdit } = usePermission();
    const presenter = useContentEntriesPresenter();

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
