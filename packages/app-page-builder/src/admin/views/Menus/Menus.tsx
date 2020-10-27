import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";
import { useRouter } from "@webiny/react-router";
import { useSecurity } from "@webiny/app-security";

const Menus = () => {
    const { history } = useRouter();

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
        <>
            <SplitView>
                <LeftPanel>
                    <MenusDataList />
                </LeftPanel>
                <RightPanel>
                    <MenusForm />
                </RightPanel>
            </SplitView>
            {canCreate && (
                <FloatingActionButton onClick={() => history.push("/page-builder/menus")} />
            )}
        </>
    );
};

export default Menus;
