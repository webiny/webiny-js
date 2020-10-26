import * as React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import GroupsDataList from "./GroupsDataList";
import GroupsForm from "./GroupsForm";
import { useRouter } from "@webiny/react-router";

const Groups = ({ scopes, formProps, listProps }: any) => {
    const { history } = useRouter();

    return (
        <>
            <SplitView>
                <LeftPanel>
                    <GroupsDataList {...listProps} />
                </LeftPanel>
                <RightPanel>
                    <GroupsForm scopes={scopes} {...formProps} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => history.push("/security/groups")}
            />
        </>
    );
};

export default Groups;
