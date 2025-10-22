import React, { useState } from "react";
// @ts-expect-error
import { useHotkeys } from "react-hotkeyz";
import { Drawer } from "@webiny/admin-ui";
import { useFullScreenContentEntry } from "~/admin/views/contentEntries/ContentEntry/FullScreenContentEntry/useFullScreenContentEntry.js";
import { CompareRevisionsTable } from "./CompareRevisionsTable.js";
import { CompareRevisionsDialog } from "./CompareRevisionsDialog.js";
import { CompareEntryRevisionsProvider } from "./useCompareEntryRevisions.js";
import { cmsLegacyEntryEditor } from "~/utils/cmsLegacyEntryEditor.js";
import type { CmsContentEntryRevision } from "~/types.js";

export const CompareRevisionsDrawer = () => {
    const { isCompareRevisionsOpen, openCompareRevisions } = useFullScreenContentEntry();
    const [selectedRevisions, setSelectedRevisions] = useState<CmsContentEntryRevision[]>([]);
    const [isComparisonDialogOpen, openComparisonDialog] = useState<boolean>(false);

    if (cmsLegacyEntryEditor) {
        return null;
    }

    const canCompare = selectedRevisions.length === 2;

    useHotkeys({
        zIndex: 55,
        disabled: !isCompareRevisionsOpen,
        keys: {
            esc: () => openCompareRevisions(false)
        }
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            openCompareRevisions(false);
            setSelectedRevisions([]);
            openComparisonDialog(false);
        }
    };

    return (
        <CompareEntryRevisionsProvider
            selectedRevisions={selectedRevisions}
            setSelectedRevisions={setSelectedRevisions}
            isComparisonDialogOpen={isComparisonDialogOpen}
            openComparisonDialog={openComparisonDialog}
            canCompare={canCompare}
        >
            <Drawer
                title={"Compare entry revisions"}
                open={isCompareRevisionsOpen}
                onOpenChange={handleOpenChange}
                modal
                bodyPadding={false}
                headerSeparator={true}
                width={1200}
            >
                <CompareRevisionsTable />
            </Drawer>
            <CompareRevisionsDialog />
        </CompareEntryRevisionsProvider>
    );
};
