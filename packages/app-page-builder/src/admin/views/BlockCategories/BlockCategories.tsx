import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import BlockCategoriesDataList from "./BlockCategoriesDataList";
import BlockCategoriesForm from "./BlockCategoriesForm";
import { PageBuilderSecurityPermission } from "~/types";

const BlockCategories: React.FC = () => {
    const { identity, getPermission } = useSecurity();
    const pbMenuPermissionRwd = useMemo((): string | null => {
        const permission = getPermission<PageBuilderSecurityPermission>("pb.block");
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
                <BlockCategoriesDataList canCreate={canCreate} />
            </LeftPanel>
            <RightPanel>
                <BlockCategoriesForm canCreate={canCreate} />
            </RightPanel>
        </SplitView>
    );
};

export default BlockCategories;
