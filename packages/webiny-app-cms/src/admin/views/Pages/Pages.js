// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { withSnackbar, type WithSnackbarProps } from "webiny-app-admin/components";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import CategoriesDialog from "./CategoriesDialog";
import { createPage } from "./graphql";

type Props = {
    createPage: (category: string, title: string) => Promise<Object>
};

type State = {
    showCategoriesDialog: boolean
};

class Pages extends React.Component<Props, State> {
    state = {
        showCategoriesDialog: false
    };

    onSelect = category => {
        this.closeDialog();
        this.props.createPage(category.id, "Untitled");
    };

    closeDialog = () => {
        this.setState({ showCategoriesDialog: true });
    };

    render() {
        return (
            <React.Fragment>
                <CategoriesDialog
                    open={this.state.showCategoriesDialog}
                    onClose={() => this.setState({ showCategoriesDialog: false })}
                    onSelect={this.onSelect}
                />
                <CompactView>
                    <LeftPanel>
                        <PagesDataList />
                    </LeftPanel>
                    <RightPanel>
                        <PageDetails />
                    </RightPanel>
                </CompactView>
                <FloatingActionButton onClick={this.closeDialog} />
            </React.Fragment>
        );
    }
}

export default compose(
    withSnackbar(),
    withRouter(),
    graphql(createPage, { name: "createMutation" }),
    withHandlers({
        createPage: ({
            createMutation,
            router,
            showSnackbar
        }: WithSnackbarProps & WithRouterProps & { createMutation: Function }) => async (
            category: string,
            title: string
        ): Promise<any> => {
            try {
                const res = await createMutation({ variables: { category, title } });
                const { data } = res.data.cms.page;
                router.goToRoute({
                    name: "Cms.Editor",
                    params: { page: data.id, revision: data.activeRevision.id }
                });
            } catch (e) {
                showSnackbar(e.message);
            }
        }
    })
)(Pages);
