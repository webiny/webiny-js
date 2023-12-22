import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import BlockCategoriesDataList from "./BlockCategoriesDataList";
import BlockCategoriesForm from "./BlockCategoriesForm";
import { useBlockCategoriesPermissions } from "~/hooks/permissions";

const BlockCategories = () => {
    const { canCreate } = useBlockCategoriesPermissions();

    return (
        <SplitView>
            <LeftPanel>
                <BlockCategoriesDataList canCreate={canCreate()} />
            </LeftPanel>
            <RightPanel>
                <BlockCategoriesForm canCreate={canCreate()} />
            </RightPanel>
        </SplitView>
    );
};

export default BlockCategories;
