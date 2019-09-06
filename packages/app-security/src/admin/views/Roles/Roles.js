import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { CrudProvider } from "@webiny/app-admin/context/CrudContext";
import RolesDataList from "./RolesDataList";
import RolesForm from "./RolesForm";
import { DELETE_ROLE, GET_ROLE, LIST_ROLES, CREATE_ROLE, UPDATE_ROLE } from "./graphql";

function Roles() {
    return (
        <CrudProvider
            read={GET_ROLE}
            delete={DELETE_ROLE}
            create={CREATE_ROLE}
            update={UPDATE_ROLE}
            list={{
                query: LIST_ROLES,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel>
                            <RolesDataList />
                        </LeftPanel>
                        <RightPanel>
                            <RolesForm />
                        </RightPanel>
                    </SplitView>
                    <FloatingActionButton onClick={actions.resetForm} />
                </>
            )}
        </CrudProvider>
    );
}

export default Roles;
