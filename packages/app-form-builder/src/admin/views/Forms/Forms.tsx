import React, { useCallback } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import FormsDataList from "./FormsDataList";
import FormDetails from "./FormDetails";
import NewFormDialog from "./NewFormDialog";
import { FormsProvider } from "./FormsContext";

function Forms() {
    const [newFormDialogOpened, openNewFormDialog] = React.useState(false);
    const onCreateForm = useCallback(() => openNewFormDialog(true), []);
    const onClose = useCallback(() => openNewFormDialog(false), []);

    return (
        <FormsProvider>
            <NewFormDialog open={newFormDialogOpened} onClose={onClose} />
            <SplitView>
                <LeftPanel span={4}>
                    <FormsDataList onCreateForm={onCreateForm} />
                </LeftPanel>
                <RightPanel span={8}>
                    <FormDetails onCreateForm={onCreateForm} />
                </RightPanel>
            </SplitView>
        </FormsProvider>
    );
}

export default Forms;
