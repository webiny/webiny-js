import React, { useCallback, useMemo } from "react";
import { Cell } from "@webiny/ui/Grid";
import { SplitView, LeftPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import ContentModelsDataList from "./ContentModelsDataList";
import NewContentModelDialog from "./NewContentModelDialog";

function ContentModels() {
    const [newContentModelDialogOpened, openNewContentModelDialog] = React.useState(false);

    const { identity } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = identity.getPermission("cms.contentModel");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    const onCreate = useCallback(() => openNewContentModelDialog(true), []);
    const onClose = useCallback(() => openNewContentModelDialog(false), []);

    return (
        <>
            <NewContentModelDialog open={newContentModelDialogOpened} onClose={onClose} />

            <SplitView>
                <Cell span={3} />
                <LeftPanel span={6}>
                    <ContentModelsDataList canCreate={canCreate} onCreate={onCreate} />
                </LeftPanel>
                <Cell span={3} />
            </SplitView>
        </>
    );
}

export default ContentModels;
