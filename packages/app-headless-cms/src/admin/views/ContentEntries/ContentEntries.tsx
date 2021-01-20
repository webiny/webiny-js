import React, { useMemo } from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import ContentDataList from "./ContentDataList";
import ContentDetails from "./ContentDetails";

export const ContentEntries = ({ contentModel }) => {
    const { identity } = useSecurity();

    const canCreate = useMemo(() => {
        // TODO: Maybe we might also need to check "cms.endpoint.manage" permission
        const permission = identity.getPermission("cms.contentEntry");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    return (
        <SplitView>
            <LeftPanel span={4}>
                <ContentDataList contentModel={contentModel} canCreate={canCreate} />
            </LeftPanel>
            <RightPanel span={8}>
                <ContentDetails contentModel={contentModel} canCreate={canCreate} />
            </RightPanel>
        </SplitView>
    );
};
