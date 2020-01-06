import React, { useState, useCallback } from "react";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CREATE_PAGE, LIST_PAGES } from "@webiny/app-page-builder/admin/graphql/pages";
import { useDataList } from "@webiny/app/hooks/useDataList";
import { CircularProgress } from "@webiny/ui/Progress";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import CategoriesDialog from "../Categories/CategoriesDialog";

const Pages = props => {
    const [creatingPage, setCreatingPage] = useState(false);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();

    const dataList = useDataList({
        query: LIST_PAGES,
        variables: {
            sort: { savedOn: -1 }
        }
    });

    const openDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeDialog = useCallback(() => setCategoriesDialog(false), []);

    const createPageMutation = useHandler(props, () => async category => {
        try {
            setCreatingPage(true);
            const res = await client.mutate({
                mutation: CREATE_PAGE,
                variables: { category },
                refetchQueries: ["PbListPages"],
                awaitRefetchQueries: true
            });
            setCreatingPage(false);
            closeDialog();
            const { data } = res.data.pageBuilder.page;
            history.push(`/page-builder/editor/${data.id}`);
        } catch (e) {
            showSnackbar(e.message);
        }
    });

    const onSelect = useCallback(category => {
        createPageMutation(category.id);
    }, []);

    return (
        <React.Fragment>
            <CategoriesDialog open={showCategoriesDialog} onClose={closeDialog} onSelect={onSelect}>
                {creatingPage && <CircularProgress label={"Creating page..."} />}
            </CategoriesDialog>
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

export default Pages;
