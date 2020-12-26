import React from "react";
import { SplitView, LeftPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ContentModelsDataList from "./ContentModelsDataList";
import NewContentModelDialog from "./NewContentModelDialog";

function ContentModels() {
    const [newContentModelDialogOpened, openNewContentModelDialog] = React.useState(false);

    return (
        <>
            <NewContentModelDialog
                open={newContentModelDialogOpened}
                onClose={() => openNewContentModelDialog(false)}
            />

            <SplitView>
                <LeftPanel span={12}>
                    <ContentModelsDataList />
                </LeftPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => openNewContentModelDialog(true)}
            />
        </>
    );
}

export default ContentModels;
