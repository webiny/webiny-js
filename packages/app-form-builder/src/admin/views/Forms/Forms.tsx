import React, { useCallback, useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useQuery } from "@apollo/react-hooks";
import FormsDataList from "./FormsDataList";
import FormDetails from "./FormDetails";
import NewFormDialog from "./NewFormDialog";
import { LIST_FORMS } from "../../graphql";
import { useSecurity } from "@webiny/app-security";

function Forms() {
    const [newFormDialogOpened, openNewFormDialog] = React.useState(false);

    const listQuery = useQuery(LIST_FORMS);

    const { identity } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = identity.getPermission("fb.form");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    const onCreateForm = useCallback(() => openNewFormDialog(true), []);
    const onClose = useCallback(() => openNewFormDialog(false), []);

    return (
        <>
            <NewFormDialog open={newFormDialogOpened} onClose={onClose} />

            <SplitView>
                <LeftPanel span={4}>
                    <FormsDataList
                        listQuery={listQuery}
                        canCreate={canCreate}
                        onCreateForm={onCreateForm}
                    />
                </LeftPanel>
                <RightPanel span={8}>
                    <FormDetails
                        refreshForms={listQuery.refetch}
                        canCreate={canCreate}
                        onCreateForm={onCreateForm}
                    />
                </RightPanel>
            </SplitView>
        </>
    );
}

export default Forms;
