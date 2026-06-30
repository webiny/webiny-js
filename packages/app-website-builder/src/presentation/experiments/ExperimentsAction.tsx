import React from "react";
import { ReactComponent as ExperimentIcon } from "@webiny/icons/call_split.svg";
import { useOpenDialog } from "@webiny/app-admin";
import { usePage } from "~/presentation/pages/PageList/hooks/usePage.js";
import { PageListConfig } from "~/presentation/pages/PageList/configs/index.js";
import { EXPERIMENTS_DIALOG } from "./ExperimentsDialog.js";
import { experimentsDialogParams } from "./experimentsDialogSchema.js";

const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

export const ExperimentsAction = () => {
    const { openDialog } = useOpenDialog(experimentsDialogParams);
    const { page } = usePage();

    // CMS revision ids are "<entryId>#<version>"; the entry id identifies the page.
    const pageEntryId = page.id.split("#")[0];

    return (
        <OptionsMenuItem
            icon={<ExperimentIcon />}
            label="A/B testing"
            onAction={() =>
                openDialog(EXPERIMENTS_DIALOG, {
                    pageId: page.id,
                    pageEntryId,
                    baselineRevisionId: page.id,
                    pageIsPublished: page.status === "published"
                })
            }
        />
    );
};
