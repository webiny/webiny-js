import React from "react";
import { useRouter } from "@webiny/react-router";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ContentModelGroupsDataList from "./ContentModelGroupsDataList";
import ContentModelGroupsForm from "./ContentModelGroupsForm";

function ContentModelGroups() {
    const { history } = useRouter();

    return (
        <>
            <SplitView>
                <LeftPanel span={4}>
                    <ContentModelGroupsDataList />
                </LeftPanel>
                <RightPanel span={8}>
                    <ContentModelGroupsForm />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => history.push("/cms/content-model-groups")}
            />
        </>
    );
}

export default ContentModelGroups;
