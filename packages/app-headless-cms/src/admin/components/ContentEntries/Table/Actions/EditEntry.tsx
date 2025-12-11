import React from "react";
import { ReactComponent as Edit } from "@webiny/icons/edit.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntriesList, useEntry, usePermission } from "~/admin/hooks/index.js";

export const EditEntry = () => {
    const { entry } = useEntry();
    const { canEdit } = usePermission();
    const { getEntryEditUrl } = useContentEntriesList();
    const { OptionsMenuLink } = ContentEntryListConfig.Browser.Entry.Action;

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuLink
            icon={<Edit />}
            label={"Edit"}
            to={getEntryEditUrl(entry)}
            data-testid={"aco.actions.entry.edit"}
        />
    );
};
