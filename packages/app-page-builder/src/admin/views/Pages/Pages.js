import React from "react";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { withRouter } from "react-router-dom";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { withDataList } from "@webiny/app/components";
import { withSnackbar } from "@webiny/app-admin/components";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import CategoriesDialog from "./CategoriesDialog";
import { createPage, listPages } from "@webiny/app-page-builder/admin/graphql/pages";
import { get } from "lodash";

class Pages extends React.Component {
    state = {
        showCategoriesDialog: false
    };

    onSelect = category => {
        this.hideCategoriesDialog();
        this.props.createPage(category.id);
    };

    showCategoriesDialog = () => {
        this.setState({ showCategoriesDialog: true });
    };

    hideCategoriesDialog = () => {
        this.setState({ showCategoriesDialog: false });
    };

    render() {
        const { dataList } = this.props;
        return (
            <React.Fragment>
                <CategoriesDialog
                    open={this.state.showCategoriesDialog}
                    onClose={() => this.setState({ showCategoriesDialog: false })}
                    onSelect={this.onSelect}
                />
                <SplitView>
                    <LeftPanel span={4}>
                        <PagesDataList dataList={dataList} />
                    </LeftPanel>
                    <RightPanel span={8}>
                        <PageDetails refreshPages={dataList.refresh} />
                    </RightPanel>
                </SplitView>
                <FloatingActionButton onClick={this.showCategoriesDialog} />
            </React.Fragment>
        );
    }
}

export default compose(
    withSnackbar(),
    withRouter,
    graphql(createPage, { name: "createMutation" }),
    withDataList({
        query: listPages,
        response: data => {
            return get(data, "pageBuilder.pages", {});
        },
        variables: {
            sort: { savedOn: -1 }
        }
    }),
    withHandlers({
        createPage: ({ createMutation, history, showSnackbar }) => async category => {
            try {
                const res = await createMutation({
                    variables: { category },
                    refetchQueries: ["PbListPages"]
                });
                const { data } = res.data.pageBuilder.page;
                history.push(`/page-builder/editor/${data.id}`);
            } catch (e) {
                showSnackbar(e.message);
            }
        }
    })
)(Pages);
