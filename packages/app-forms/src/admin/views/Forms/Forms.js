import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import FormsDataList from "./FormsDataList";
import FormDetails from "./FormDetails";
import NewFormDialog from "./NewFormDialog";
import { LIST_FORMS } from "@webiny/app-forms/admin/viewsGraphql";
import { useDataList } from "@webiny/app/hooks/useDataList";

function Forms() {
    const [newFormDialogOpened, openNewFormDialog] = React.useState(false);

    const dataList = useDataList({
        query: LIST_FORMS,
        variables: {
            sort: { savedOn: -1 }
        }
    });

    return (
        <>
            <NewFormDialog
                open={newFormDialogOpened}
                onClose={() => openNewFormDialog(false)}
                formsDataList={dataList}
            />

            <SplitView>
                <LeftPanel span={4}>
                    <FormsDataList dataList={dataList} />
                </LeftPanel>
                <RightPanel span={8}>
                    <FormDetails refreshForms={dataList.refresh} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={() => openNewFormDialog(true)} />
        </>
    );
}

export default Forms;
