// @flow
import * as React from "react";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import PagesDataList from "./PagesDataList";
import PagesForm from "./PagesForm";
import { withRouter, type WithRouterProps } from "webiny-app/components";

const Pages = ({ router }: WithRouterProps) => {
    return (
        <React.Fragment>
            <CompactView>
                <LeftPanel>
                    <PagesDataList />
                </LeftPanel>
                <RightPanel>
                    <PagesForm />
                </RightPanel>
            </CompactView>
            <FloatingActionButton
                onClick={() =>
                    router.goToRoute({
                        params: { id: null },
                        merge: true
                    })
                }
            />
        </React.Fragment>
    );
};

export default withRouter()(Pages);
