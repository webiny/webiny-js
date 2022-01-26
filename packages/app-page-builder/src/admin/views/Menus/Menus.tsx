import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";
import { useSecurity } from "@webiny/app-security";

const Menus: React.FC = () => {
    const { identity } = useSecurity();
    const pbMenuPermission = useMemo(() => {
        return identity.getPermission("pb.menu");
    }, []);

    const canCreate = useMemo(() => {
        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("w");
        }

        return true;
    }, []);

    return (
        <SplitView>
            <LeftPanel span={3}>
                <MenusDataList canCreate={canCreate} />
            </LeftPanel>
            <RightPanel span={9}>
                <MenusForm canCreate={canCreate} />
            </RightPanel>
        </SplitView>
    );
};

export default Menus;
