import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import TargetsDataList from "./TargetsDataList";
import TargetsForm from "./TargetForm";

const Targets = () => {
    return (
        <SplitView>
            <LeftPanel>
                <TargetsDataList />
            </LeftPanel>
            <RightPanel>
                <TargetsForm />
            </RightPanel>
        </SplitView>
    );
};

export default Targets;
