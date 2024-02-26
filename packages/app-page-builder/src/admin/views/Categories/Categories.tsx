import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";
import { useCategoriesPermissions } from "~/hooks/permissions";

const Categories = () => {
    const { canCreate } = useCategoriesPermissions();

    return (
        <SplitView>
            <LeftPanel>
                <CategoriesDataList canCreate={canCreate()} />
            </LeftPanel>
            <RightPanel>
                <CategoriesForm canCreate={canCreate()} />
            </RightPanel>
        </SplitView>
    );
};

export default Categories;
