// @flow
import * as React from "react";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import GroupsDataList from "./Groups/GroupsDataList";
import GroupsForm from "./Groups/GroupsForm";
import { withRouter, type WithRouterProps } from "webiny-app/components";

const Groups = (props: WithRouterProps) => {
    return (
        <CompactView>
            <LeftPanel>
                <GroupsDataList />
            </LeftPanel>
            <RightPanel>
                <GroupsForm />
            </RightPanel>

            <FloatingActionButton
                onClick={() =>
                    props.router.goToRoute({
                        params: { id: null },
                        merge: true
                    })
                }
            />
        </CompactView>
    );
};

export default withRouter()(Groups);
