import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";
import { useSecurity } from "@webiny/app-security";

const Menus: React.FC = () => {
    const { identity } = useSecurity();
    const pbMenuPermissionRwd = useMemo((): string | null => {
        if (!identity || !identity.getPermission) {
            return null;
        }
        const permission = identity.getPermission("pb.menu");
        if (!permission) {
            return null;
        }
        return permission.rwd || null;
    }, [identity]);

    const canCreate = useMemo(() => {
        if (typeof pbMenuPermissionRwd === "string") {
            return pbMenuPermissionRwd.includes("w");
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
