import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList, useEntry, usePermission } from "~/admin/hooks";

export const EditEntry = () => {
    const { entry } = useEntry();
    const { canEdit } = usePermission();
    const { getEntryEditUrl } = useContentEntriesList();
    const { OptionsMenuLink } = ContentEntryListConfig.Browser.EntryAction;

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
