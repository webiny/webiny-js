import * as React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import GroupsDataList from "./GroupsDataList";
import GroupsForm from "./GroupsForm";

const Groups = ({ formProps, listProps }: any) => {
    return (
        <SplitView>
            <LeftPanel>
                <GroupsDataList {...listProps} />
            </LeftPanel>
            <RightPanel>
                <GroupsForm {...formProps} />
            </RightPanel>
        </SplitView>
    );
};

export default Groups;
