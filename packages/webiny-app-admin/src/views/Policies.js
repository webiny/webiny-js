// @flow
import * as React from "react";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import PoliciesDataList from "./Policies/PoliciesDataList";
import PoliciesForm from "./Policies/PoliciesForm";
import { withRouter, type WithRouterProps } from "webiny-app/components";

const Policies = (props: WithRouterProps) => {
    return (
        <React.Fragment>
            <CompactView>
                <LeftPanel>
                    <PoliciesDataList />
                </LeftPanel>
                <RightPanel>
                    <PoliciesForm />
                </RightPanel>
            </CompactView>
            <FloatingActionButton
                onClick={() =>
                    props.router.goToRoute({
                        params: { id: null },
                        merge: true
                    })
                }
            />
        </React.Fragment>
    );
};

export default withRouter()(Policies);
