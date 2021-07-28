import React, { useMemo, useState, useCallback } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import { useSecurity } from "@webiny/app-security";
import CategoriesDialog from "../Categories/CategoriesDialog";
import { CircularProgress } from "@webiny/ui/Progress";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@apollo/react-hooks";
import { CREATE_PAGE } from "../../graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";

const Pages = () => {
    const [creatingPage, setCreatingPage] = useState(false);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const openDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeDialog = useCallback(() => setCategoriesDialog(false), []);

    const [create] = useMutation(CREATE_PAGE);

    const createPageMutation = useCallback(async ({ slug: category }) => {
        try {
            setCreatingPage(true);
            const res = await create({
                variables: { category },
                update(cache, { data }) {
                    if (data.pageBuilder.createPage.error) {
                        return;
                    }

                    GQLCache.addPageToListCache(cache, data.pageBuilder.createPage.data);
                }
            });

            setCreatingPage(false);
            closeDialog();

            const { error, data } = res.data.pageBuilder.createPage;
            if (error) {
                showSnackbar(error.message);
            } else {
                history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
            }
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    const { identity } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = identity.getPermission("pb.page");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
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
                    <PagesDataList canCreate={canCreate} onCreatePage={openDialog} />
                </LeftPanel>
                <RightPanel>
                    <PageDetails canCreate={canCreate} onCreatePage={openDialog} />
                </RightPanel>
            </SplitView>
        </>
    );
};

export default Pages;
