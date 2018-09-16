// @flow
import * as React from "react";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import UsersDataList from "./Users/UsersDataList";
import UsersForm from "./Users/UsersForm";
import { withRouter, type WithRouterProps } from "webiny-app/components";

const Users = (props: WithRouterProps) => {
    return (
        <CompactView>
            <LeftPanel>
                <UsersDataList />
            </LeftPanel>
            <RightPanel>
                <UsersForm />
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

export default withRouter()(Users);
