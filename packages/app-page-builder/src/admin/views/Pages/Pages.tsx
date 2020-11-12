import React, { useMemo, useState, useCallback } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import PagesDataList from "./PagesDataList";
import { useSecurity } from "@webiny/app-security";
import CategoriesDialog from "../Categories/CategoriesDialog";
import { CircularProgress } from "@webiny/ui/Progress";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "react-apollo";
import { CREATE_PAGE } from "@webiny/app-page-builder/admin/graphql/pages";

const Pages = () => {
    const [creatingPage, setCreatingPage] = useState(false);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const openDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeDialog = useCallback(() => setCategoriesDialog(false), []);

    // ------------

    // TODO remove
    // eslint-disable-next-line
    const [create, createMutation] = useMutation(CREATE_PAGE, {
        // refetchQueries: [{ query: LIST_MENUS }]
    });

    const createPageMutation = useCallback(async ({ slug: category }) => {
        try {
            setCreatingPage(true);
            const res = await create({
                variables: { category }
            });

            setCreatingPage(false);
            closeDialog();

            const { data } = res.data.pageBuilder.page;
            history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    const { identity } = useSecurity();
    const pbPagePermission = useMemo(() => {
        return identity.getPermission("pb.page");
    }, []);

    const canCreate = useMemo(() => {
        if (typeof pbPagePermission.rwd === "string") {
            return pbPagePermission.rwd.includes("w");
        }

        return true;
    }, []);

    return (
        <>
            <CategoriesDialog
                open={showCategoriesDialog}
                onClose={closeDialog}
                onSelect={createPageMutation}
            >
                {creatingPage && <CircularProgress label={"Creating page..."} />}
            </CategoriesDialog>
            <SplitView>
                <LeftPanel>
                    <PagesDataList />
                </LeftPanel>
                <RightPanel>{/*<PageDetails />*/}</RightPanel>
            </SplitView>
            {canCreate && (
                <FloatingActionButton data-testid="new-record-button" onClick={openDialog} />
            )}
        </>
    );
};

export default Pages;
