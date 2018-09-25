// @flow
import * as React from "react";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";
import { withRouter, type WithRouterProps } from "webiny-app/components";

const Categories = ({ router }: WithRouterProps) => {
    return (
        <React.Fragment>
            <CompactView>
                <LeftPanel>
                    <CategoriesDataList />
                </LeftPanel>
                <RightPanel>
                    <CategoriesForm />
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

export default withRouter()(Categories);
