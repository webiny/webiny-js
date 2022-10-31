import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { TeamsDataList, TeamsDataListProps } from "./TeamsDataList";
import { TeamsForm, TeamsFormProps } from "./TeamsForm";

export interface TeamsProps {
    listProps?: TeamsDataListProps;
    formProps?: TeamsFormProps;
}
export const Teams: React.FC<TeamsProps> = ({ formProps = {}, listProps = {} }) => {
    return (
        <SplitView>
            <LeftPanel>
                <TeamsDataList {...listProps} />
            </LeftPanel>
            <RightPanel>
                <TeamsForm {...formProps} />
            </RightPanel>
        </SplitView>
    );
};
