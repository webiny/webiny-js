import React, { useCallback } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import FormsDataList from "./FormsDataList";
import FormDetails from "./FormDetails";
import NewFormDialog from "./NewFormDialog";
import { FormsProvider } from "./FormsContext";

const Forms = () => {
    const [newFormDialogOpened, openNewFormDialog] = React.useState<boolean>(false);
    const onCreateForm = useCallback((): void => openNewFormDialog(true), []);
    const onClose = useCallback((): void => openNewFormDialog(false), []);

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
};

export default Forms;
