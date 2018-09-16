// @flow
import * as React from "react";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import ApiTokensDataList from "./ApiTokens/ApiTokensDataList";
import ApiTokensForm from "./ApiTokens/ApiTokensForm";
import { withRouter, type WithRouterProps } from "webiny-app/components";

const ApiTokens = (props: WithRouterProps) => {
    return (
        <CompactView>
            <LeftPanel>
                <ApiTokensDataList />
            </LeftPanel>
            <RightPanel>
                <ApiTokensForm />
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

export default withRouter()(ApiTokens);
