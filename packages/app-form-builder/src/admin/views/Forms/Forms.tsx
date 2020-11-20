import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { useQuery } from "react-apollo";
import FormsDataList from "./FormsDataList";
import FormDetails from "./FormDetails";
import NewFormDialog from "./NewFormDialog";
import { LIST_FORMS } from "../../viewsGraphql";

function Forms() {
    const [newFormDialogOpened, openNewFormDialog] = React.useState(false);

    const listQuery = useQuery(LIST_FORMS, {
        variables: {
            sort: { savedOn: -1 }
        }
    });

    return (
        <>
            <NewFormDialog open={newFormDialogOpened} onClose={() => openNewFormDialog(false)} />

            <SplitView>
                <LeftPanel span={4}>
                    <FormsDataList listQuery={listQuery} />
                </LeftPanel>
                <RightPanel span={8}>
                    <FormDetails refreshForms={listQuery.refetch} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => openNewFormDialog(true)}
            />
        </>
    );
}

export default Forms;
