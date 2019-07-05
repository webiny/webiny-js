import React from "react";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { withRouter } from "react-router-dom";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { FloatingActionButton } from "webiny-admin/components/FloatingActionButton";
import { withDataList } from "webiny-app/components";
import { withSnackbar } from "webiny-admin/components";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import CategoriesDialog from "./CategoriesDialog";
import { createPage, listPages } from "webiny-app-cms/admin/graphql/pages";
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
            return get(data, "cms.pageBuilder.pages", {});
        },
        variables: {
            sort: { savedOn: -1 }
        }
    }),
    withHandlers({
        createPage: ({ createMutation, history, showSnackbar }) => async category => {
            try {
                const res = await createMutation({ variables: { category }, refetchQueries: ["CmsListPages"] });
                const { data } = res.data.cms.pageBuilder.page;
                history.push(`/cms/editor/${data.id}`);
            } catch (e) {
                showSnackbar(e.message);
            }
        }
    })
)(Pages);
