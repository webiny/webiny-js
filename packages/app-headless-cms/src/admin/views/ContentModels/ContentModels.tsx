import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ContentModelsDataList from "./ContentModelsDataList";
import ContentModelDetails from "./ContentModelDetails";
import NewContentModelDialog from "./NewContentModelDialog";
import { LIST_CONTENT_MODELS } from "../../viewsGraphql";
import { useDataList } from "@webiny/app/hooks/useDataList";

function ContentModels() {
    const [newContentModelDialogOpened, openNewContentModelDialog] = React.useState(false);

    const dataList = useDataList({
        query: LIST_CONTENT_MODELS,
        variables: {
            sort: { savedOn: -1 }
        }
    });

    return (
        <>
            <NewContentModelDialog
                open={newContentModelDialogOpened}
                onClose={() => openNewContentModelDialog(false)}
                contentModelsDataList={dataList}
            />

            <SplitView>
                <LeftPanel span={4}>
                    <ContentModelsDataList dataList={dataList} />
                </LeftPanel>
                <RightPanel span={8}>
                    <ContentModelDetails refreshContentModels={dataList.refresh} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => openNewContentModelDialog(true)}
            />
        </>
    );
}

export default ContentModels;
