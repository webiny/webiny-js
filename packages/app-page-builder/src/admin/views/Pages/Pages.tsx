import React, { useMemo, useState, useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import * as GQLCache from "~/admin/views/Pages/cache";
import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import { CREATE_PAGE, CREATE_PAGE_FROM_TEMPLATE } from "~/admin/graphql/pages";
import useImportPage from "./hooks/useImportPage";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import PageTemplatesDialog from "./PageTemplatesDialog";
import { PageBuilderSecurityPermission, PbPageTemplate } from "~/types";

const Pages: React.FC = () => {
    const { history } = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);
    const [showTemplatesDialog, setTemplatesDialog] = useState(false);
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const openCategoriesDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoriesDialog = useCallback(() => setCategoriesDialog(false), []);
    const openTemplatesDialog = useCallback(() => setTemplatesDialog(true), []);
    const closeTemplatesDialog = useCallback(() => setTemplatesDialog(false), []);

    const { showDialog } = useImportPage({
        setLoadingLabel: () => setIsLoading(true),
        clearLoadingLabel: () => setIsLoading(false),
        closeDialog: closeCategoriesDialog
    });

    const onCreatePage = useCallback(async (template?: PbPageTemplate) => {
        setIsLoading(true);
        try {
            const MUTATION = template ? CREATE_PAGE_FROM_TEMPLATE : CREATE_PAGE;
            const variables = {
                // category is temporarily hardcoded
                category: "static",
                templateId: template?.id
            };

            const newPage = await client.mutate({
                mutation: MUTATION,
                variables,
                update(cache, { data }) {
                    if (data.pageBuilder.createPage.error) {
                        return;
                    }

                    GQLCache.addPageToListCache(cache, data.pageBuilder.createPage.data);
                }
            });

            const { error, data } = newPage.data.pageBuilder.createPage;
            if (error) {
                showSnackbar(error.message);
            } else {
                history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
            }
        } catch (e) {
            showSnackbar(e.message);
        }
        setIsLoading(false);
    }, []);

    const { identity, getPermission } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = getPermission<PageBuilderSecurityPermission>("pb.page");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, [identity]);

    return (
        <>
            <CategoriesDialog
                open={showCategoriesDialog}
                onClose={closeCategoriesDialog}
                onSelect={showDialog}
            >
                {isLoading && <CircularProgress label={"Importing page..."} />}
            </CategoriesDialog>
            {showTemplatesDialog && (
                <PageTemplatesDialog
                    onClose={closeTemplatesDialog}
                    onSelect={onCreatePage}
                    isLoading={isLoading}
                />
            )}
            <SplitView>
                <LeftPanel>
                    <PagesDataList
                        canCreate={canCreate}
                        onCreatePage={openTemplatesDialog}
                        onImportPage={openCategoriesDialog}
                    />
                </LeftPanel>
                <RightPanel>
                    <PageDetails
                        canCreate={canCreate}
                        onCreatePage={openTemplatesDialog}
                        onDelete={() => history.push("/page-builder/pages")}
                    />
                </RightPanel>
            </SplitView>
        </>
    );
};

export default Pages;
