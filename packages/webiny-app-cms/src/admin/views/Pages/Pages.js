// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, withHandlers } from "recompose";
//import { graphql } from "react-apollo";
import { app } from "webiny-app";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import { withRouter } from "webiny-app/components";
import CategoriesDialog from "./CategoriesDialog";
import { createPage } from "./graphql/pages";

type Props = {
    createPage: (category: string) => Promise<Object>
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
        this.props.createPage(category.id);
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
    withRouter(),
    // graphql(createPage, { name: "createPage" }), TODO: use this once mutations are in place
    withHandlers({
        createPage(props) {
            return category => {
                return app.graphql
                    .query({ query: createPage, variables: { category, title: "Untitled" } })
                    .then(({ data }: Object) => {
                        const page = data.Cms.Pages.create;
                        props.router.goToRoute({
                            name: "Cms.Editor",
                            params: { revision: page.activeRevision.id, page: page.id }
                        });
                    })
                    .catch(e => {
                        console.error(e);
                    });
            };
        }
    })
)(Pages);
