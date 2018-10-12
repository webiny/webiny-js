// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import { withRouter } from "webiny-app/components";
import CategoriesDialog from "./CategoriesDialog";
import { createPage } from "./graphql/pages";

type Props = {
    createPage: ({ category: string, title: string }) => Promise<Object>
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
        this.props.createPage({ category: category.id, title: "Untitled" });
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
    graphql(createPage, { name: "createPage" }),
    withHandlers({
        createPage: ({ createPage }: { createPage: Function }): Function => {
            return (category: string, title: string): Promise<any> => {
                return createPage({ variables: { category, title } })
                    .then((data: string) => {
                        console.log(data, "Return value");
                    })
                    .catch((e: Object) => {
                        console.error(e, "Error");
                    });
            };
        }
    })
)(Pages);
