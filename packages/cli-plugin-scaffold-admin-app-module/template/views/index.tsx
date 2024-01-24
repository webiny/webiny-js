import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import TargetDataModelsDataList from "./TargetDataModelsDataList";
import TargetDataModelsForm from "./TargetDataModelsForm";

/**
 * Main view component - renders data list and form.
 */

const TargetDataModelsView = () => {
    return (
        <SplitView>
            <LeftPanel>
                <TargetDataModelsDataList />
            </LeftPanel>
            <RightPanel>
                <TargetDataModelsForm />
            </RightPanel>
        </SplitView>
    );
};

export default TargetDataModelsView;
