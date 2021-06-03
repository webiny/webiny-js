import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import TargetsDataList from "./TargetsDataList";
import TargetForm from "./TargetForm";

export const TargetsView = () => {
    return (
        <SplitView>
            <LeftPanel>
                <TargetsDataList />
            </LeftPanel>
            <RightPanel>
                <TargetForm />
            </RightPanel>
        </SplitView>
    );
};
