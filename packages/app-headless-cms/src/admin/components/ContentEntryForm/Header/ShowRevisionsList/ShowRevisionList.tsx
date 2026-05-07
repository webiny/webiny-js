import React from "react";
import { ReactComponent as ListIcon } from "@webiny/icons/checklist.svg";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useFullScreenContentEntry } from "~/admin/views/contentEntries/ContentEntry/FullScreenContentEntry/useFullScreenContentEntry.js";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";

export const ShowRevisionList = () => {
    const { openRevisionList } = useFullScreenContentEntry();
    const { useOptionsMenuItem } = ContentEntryEditorConfig.Actions.MenuItemAction;
    const { OptionsMenuItem } = useOptionsMenuItem();
    const { entry } = useContentEntry();

    return (
        <OptionsMenuItem
            icon={<ListIcon />}
            label={"Show entry revisions"}
            disabled={!entry.id}
            onAction={() => openRevisionList(true)}
            data-testid={"cms.content-form.header.show-revisions"}
        />
    );
};
