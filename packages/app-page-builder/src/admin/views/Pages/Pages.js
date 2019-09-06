import React, { useState, useCallback } from "react";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import { get } from "lodash";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { withDataList } from "@webiny/app/components";
import { useSnackbar } from "@webiny/app-admin/components";
import { createPage, listPages } from "@webiny/app-page-builder/admin/graphql/pages";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import CategoriesDialog from "./CategoriesDialog";


const Pages = props => {
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();

    const createPageMutation = useHandler(props, () => async category => {
        try {
            const res = await client.mutate({
                mutation: createPage,
                variables: { category },
                refetchQueries: ["PbListPages"]
            });
            const { data } = res.data.pageBuilder.page;
            history.push(`/page-builder/editor/${data.id}`);
        } catch (e) {
            showSnackbar(e.message);
        }
    });

    const openDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeDialog = useCallback(() => setCategoriesDialog(false), []);

    const onSelect = useCallback(category => {
        closeDialog();
        createPageMutation(category.id);
    }, []);

    const { dataList } = props;

    return (
        <React.Fragment>
            <CategoriesDialog
                open={showCategoriesDialog}
                onClose={closeDialog}
                onSelect={onSelect}
            />
            <SplitView>
                <LeftPanel span={4}>
                    <PagesDataList dataList={dataList} />
                </LeftPanel>
                <RightPanel span={8}>
                    <PageDetails refreshPages={dataList.refresh} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={openDialog} />
        </React.Fragment>
    );
};

export default withDataList({
    query: listPages,
    response: data => {
        return get(data, "pageBuilder.pages", {});
    },
    variables: {
        sort: { savedOn: -1 }
    }
})(Pages);
