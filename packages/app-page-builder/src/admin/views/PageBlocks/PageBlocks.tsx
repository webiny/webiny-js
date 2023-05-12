import React, { useMemo, useCallback, useState } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";

import { PageBuilderSecurityPermission } from "~/types";
import BlocksByCategoriesDataList from "./BlocksByCategoriesDataList";
import PageBlocksDataList from "./PageBlocksDataList";

export interface CreatableItem {
    createdBy?: {
        id?: string;
    };
}

const PageBlocks: React.FC = () => {
    const [filter, setFilter] = useState<string>("");
    const { identity, getPermission } = useSecurity();
    const pbPageBlockPermission = useMemo((): PageBuilderSecurityPermission | null => {
        return getPermission("pb.block");
    }, [identity]);

    const canCreate = useMemo((): boolean => {
        if (!pbPageBlockPermission) {
            return false;
        }
        if (typeof pbPageBlockPermission.rwd === "string") {
            return pbPageBlockPermission.rwd.includes("w");
        }
        return true;
    }, []);

    const canEdit = useCallback((item: CreatableItem): boolean => {
        if (!pbPageBlockPermission) {
            return false;
        }
        if (pbPageBlockPermission.own) {
            const identityId = identity ? identity.id || identity.login : null;
            return item.createdBy?.id === identityId;
        }
        if (typeof pbPageBlockPermission.rwd === "string") {
            return pbPageBlockPermission.rwd.includes("w");
        }

        return true;
    }, []);

    const canDelete = useCallback((item: CreatableItem): boolean => {
        if (!pbPageBlockPermission) {
            return false;
        }
        if (pbPageBlockPermission.own) {
            const identityId = identity ? identity.id || identity.login : null;
            return item.createdBy?.id === identityId;
        }
        if (typeof pbPageBlockPermission.rwd === "string") {
            return pbPageBlockPermission.rwd.includes("d");
        }

        return true;
    }, []);

    return (
        <SplitView>
            <LeftPanel>
                <BlocksByCategoriesDataList
                    filter={filter}
                    setFilter={setFilter}
                    canCreate={canCreate}
                />
            </LeftPanel>
            <RightPanel>
                <PageBlocksDataList
                    filter={filter}
                    canCreate={canCreate}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            </RightPanel>
        </SplitView>
    );
};

export default PageBlocks;
