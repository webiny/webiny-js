import React from "react";
import { Dialog, Button } from "@webiny/admin-ui";
import { useCompareEntryRevisions } from "./useCompareEntryRevisions.js";
import { CompareRevisionsContent } from "./CompareRevisionsContent.js";

export const CompareRevisionsDialog = () => {
    const { isComparisonDialogOpen, openComparisonDialog, selectedRevisions } =
        useCompareEntryRevisions();

    if (selectedRevisions.length !== 2) {
        return null;
    }

    const [revision1, revision2] = selectedRevisions;

    return (
        <Dialog
            open={isComparisonDialogOpen}
            onOpenChange={openComparisonDialog}
            title={`Compare Revisions: #${revision1.meta.version} vs #${revision2.meta.version}`}
            size={"full"}
            data-testid={"cms.compare-revisions.dialog"}
            actions={
                <Button
                    variant={"secondary"}
                    onClick={() => openComparisonDialog(false)}
                    title={"Close"}
                ></Button>
            }
        >
            <CompareRevisionsContent revision1={revision1} revision2={revision2} />
        </Dialog>
    );
};
