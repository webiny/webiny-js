// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import { withRouter, withDataList, type WithRouterProps } from "webiny-app/components";
import { withSnackbar, type WithSnackbarProps } from "webiny-app-admin/components";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import CategoriesDialog from "./CategoriesDialog";
import { createPage, listPages } from "webiny-app-cms/admin/graphql/pages";
import { get } from "lodash";

type Props = {
    createPage: (category: string) => Promise<Object>,
    dataList: Object
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
        const { dataList } = this.props;
        return (
            <React.Fragment>
                <CategoriesDialog
                    open={this.state.showCategoriesDialog}
                    onClose={() => this.setState({ showCategoriesDialog: false })}
                    onSelect={this.onSelect}
                />
                <CompactView>
                    <LeftPanel span={4}>
                        <PagesDataList dataList={dataList} />
                    </LeftPanel>
                    <RightPanel span={8}>
                        <PageDetails refreshPages={dataList.refresh} />
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
    withDataList({
        query: listPages,
        response: data => {
            return get(data, "cms.pages", {});
        },
        variables: {
            sort: { savedOn: -1 }
        }
    }),
    withHandlers({
        createPage: ({
            createMutation,
            router,
            showSnackbar
        }: WithSnackbarProps & WithRouterProps & { createMutation: Function }) => async (
            category: string
        ): Promise<any> => {
            try {
                const res = await createMutation({ variables: { category } });
                const { data } = res.data.cms.page;
                router.goToRoute({
                    name: "Cms.Editor",
                    params: { id: data.id }
                });
            } catch (e) {
                showSnackbar(e.message);
            }
        }
    })
)(Pages);
