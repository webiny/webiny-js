import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";
import { useMenusPermissions } from "~/hooks/permissions";

const Menus = () => {
    const { canCreate } = useMenusPermissions();
    return (
        <SplitView>
            <LeftPanel span={3}>
                <MenusDataList canCreate={canCreate()} />
            </LeftPanel>
            <RightPanel span={9}>
                <MenusForm canCreate={canCreate()} />
            </RightPanel>
        </SplitView>
    );
};

export default Menus;
