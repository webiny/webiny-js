import React, { useState } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import BlocksByCategoriesDataList from "./BlocksByCategoriesDataList";
import PageBlocksDataList from "./PageBlocksDataList";
import { useBlocksPermissions } from "~/hooks/permissions";

export interface CreatableItem {
    createdBy?: {
        id?: string;
    };
}

const PageBlocks = () => {
    const [filter, setFilter] = useState<string>("");
    const { canCreate, canUpdate, canDelete } = useBlocksPermissions();

    return (
        <SplitView>
            <LeftPanel span={4}>
                <BlocksByCategoriesDataList
                    filter={filter}
                    setFilter={setFilter}
                    canCreate={canCreate()}
                />
            </LeftPanel>
            <RightPanel span={8}>
                <PageBlocksDataList
                    filter={filter}
                    canCreate={canCreate()}
                    canEdit={record => canUpdate(record?.createdBy?.id)}
                    canDelete={record => canDelete(record?.createdBy?.id)}
                />
            </RightPanel>
        </SplitView>
    );
};

export default PageBlocks;
