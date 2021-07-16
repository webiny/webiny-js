import React, { useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import ContentModelGroupsDataList from "./ContentModelGroupsDataList";
import ContentModelGroupsForm from "./ContentModelGroupsForm";

function ContentModelGroups() {
    const { identity } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = identity.getPermission("cms.contentModelGroup");
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
                <ContentModelGroupsDataList canCreate={canCreate} />
            </LeftPanel>
            <RightPanel span={8}>
                <ContentModelGroupsForm canCreate={canCreate} />
            </RightPanel>
        </SplitView>
    );
}

export default ContentModelGroups;
