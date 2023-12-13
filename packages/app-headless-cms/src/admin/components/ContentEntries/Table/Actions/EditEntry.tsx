import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { AcoConfig } from "@webiny/app-aco";
import { useContentEntriesList, useEntry, usePermission } from "~/admin/hooks";

export const EditEntry = () => {
    const { entry } = useEntry();
    const { canEdit } = usePermission();
    const { onEditEntry } = useContentEntriesList();
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Edit />}
            label={"Edit"}
            onAction={() => onEditEntry(entry)}
            data-testid={"aco.actions.entry.edit"}
        />
    );
};
