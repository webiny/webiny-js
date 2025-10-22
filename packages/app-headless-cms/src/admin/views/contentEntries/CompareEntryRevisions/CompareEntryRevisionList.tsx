import React from "react";
import { ReactComponent as ListIcon } from "@webiny/icons/compare_arrows.svg";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useFullScreenContentEntry } from "~/admin/views/contentEntries/ContentEntry/FullScreenContentEntry/useFullScreenContentEntry.js";

export const CompareEntryRevisionList = () => {
    const { openCompareRevisions } = useFullScreenContentEntry();
    const { useOptionsMenuItem } = ContentEntryEditorConfig.Actions.MenuItemAction;
    const { OptionsMenuItem } = useOptionsMenuItem();

    return (
        <OptionsMenuItem
            icon={<ListIcon />}
            label={"Compare entry revisions"}
            onAction={() => openCompareRevisions(true)}
            data-testid={"cms.content-form.header.compare-revisions"}
        />
    );
};
