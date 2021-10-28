import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import TenantDataList from "./TenantDataList";
import TenantForm from "./TenantForm";

export const TenantsView = () => {
    return (
        <SplitView>
            <LeftPanel>
                <TenantDataList />
            </LeftPanel>
            <RightPanel>
                <TenantForm />
            </RightPanel>
        </SplitView>
    );
};
