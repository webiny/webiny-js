import React, { useCallback } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { CrudProvider } from "@webiny/app-admin/context/CrudContext";
import useRouter from "use-react-router";
import RolesDataList from "./Roles/RolesDataList";
import RolesForm from "./Roles/RolesForm";

function Roles() {
    const { location, history } = useRouter();

    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

    return (
        <CrudProvider>
            <React.Fragment>
                <SplitView>
                    <LeftPanel>
                        <RolesDataList />
                    </LeftPanel>
                    <RightPanel>
                        <RolesForm />
                    </RightPanel>
                </SplitView>
                <FloatingActionButton onClick={createNew} />
            </React.Fragment>
        </CrudProvider>
    );
}

export default Roles;
