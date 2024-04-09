import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { GroupsDataList, GroupsDataListProps } from "./GroupsDataList";
import { GroupsForm, GroupsFormProps } from "./GroupsForm";

export interface GroupsProps {
    listProps?: GroupsDataListProps;
    formProps?: GroupsFormProps;
}
export const Groups = ({ formProps = {}, listProps = {} }: GroupsProps) => {
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
