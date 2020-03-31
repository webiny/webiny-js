import React from "react";
import { SplitView, LeftPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ContentModelsDataList from "./ContentModelsDataList";
import NewContentModelDialog from "./NewContentModelDialog";
import { LIST_CONTENT_MODELS } from "../../viewsGraphql";
import { useDataList } from "@webiny/app/hooks/useDataList";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

function ContentModels() {
    const [newContentModelDialogOpened, openNewContentModelDialog] = React.useState(false);

    const {
        environments: { apolloClient }
    } = useCms();

    const dataList = useDataList({
        client: apolloClient,
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
                <LeftPanel span={12}>
                    <ContentModelsDataList dataList={dataList} />
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
