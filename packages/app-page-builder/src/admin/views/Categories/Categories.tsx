import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";

const Categories = () => {
    const { identity } = useSecurity();
    const pbMenuPermission = useMemo(() => {
        return identity.getPermission("pb.category");
    }, []);

    const canCreate = useMemo(() => {
        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("w");
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
