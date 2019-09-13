import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import { READ_MENU, LIST_MENUS, CREATE_MENU, UPDATE_MENU, DELETE_MENU } from "./graphql";

function Menus() {
    return (
        <CrudProvider
            delete={DELETE_MENU}
            read={READ_MENU}
            create={CREATE_MENU}
            update={UPDATE_MENU}
            list={{
                query: LIST_MENUS,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel span={3}>
                            <MenusDataList />
                        </LeftPanel>
                        <RightPanel span={9}>
                            <MenusForm />
                        </RightPanel>
                    </SplitView>
                    <FloatingActionButton onClick={actions.resetForm} />
                </>
            )}
        </CrudProvider>
    );
}

export default Menus;
