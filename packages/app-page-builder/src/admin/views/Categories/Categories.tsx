import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";
import { PageBuilderSecurityPermission } from "~/types";

const Categories: React.VFC = () => {
    const { identity, getPermission } = useSecurity();
    const pbMenuPermissionRwd = useMemo((): string | null => {
        const permission = getPermission<PageBuilderSecurityPermission>("pb.category");
        if (!permission) {
            return null;
        }
        return permission.rwd || null;
    }, [identity]);

    const canCreate = useMemo((): boolean => {
        if (typeof pbMenuPermissionRwd === "string") {
            return pbMenuPermissionRwd.includes("w");
        }

        return true;
    }, []);

    return (
        <SplitView>
            <LeftPanel>
                <CategoriesDataList canCreate={canCreate} />
            </LeftPanel>
            <RightPanel>
                <CategoriesForm canCreate={canCreate} />
            </RightPanel>
        </SplitView>
    );
};

export default Categories;
