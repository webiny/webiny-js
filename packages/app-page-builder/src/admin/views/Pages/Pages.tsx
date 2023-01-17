import React, { useMemo, useState, useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";

import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import * as GQLCache from "~/admin/views/Pages/cache";
import CategoriesDialog from "~/admin/views/Categories/CategoriesDialog";
import { CREATE_PAGE, UPDATE_PAGE } from "~/admin/graphql/pages";
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
    const [create] = useMutation(CREATE_PAGE);
    const [update] = useMutation(UPDATE_PAGE);
    const { showSnackbar } = useSnackbar();

    const openCategoriesDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeCategoriesDialog = useCallback(() => setCategoriesDialog(false), []);
    const openTemplatesDialog = useCallback(() => setTemplatesDialog(true), []);
    const closeTemplatesDialog = useCallback(() => setTemplatesDialog(false), []);

    const { showDialog } = useImportPage({
        setLoadingStatus: () => setIsLoading(true),
        clearLoadingStatus: () => setIsLoading(false),
        closeDialog: closeCategoriesDialog
    });

    const onCreatePage = useCallback(async (template?: PbPageTemplate) => {
        try {
            closeTemplatesDialog();

            const res = await create({
                variables: { category: "static" }, // hardcoded for now
                update(cache, { data }) {
                    if (data.pageBuilder.createPage.error) {
                        return;
                    }

                    GQLCache.addPageToListCache(cache, data.pageBuilder.createPage.data);
                }
            });

            if (template) {
                await update({
                    variables: {
                        id: res.data.pageBuilder.createPage.data.id,
                        data: {
                            content: {
                                ...template.content,
                                data: {
                                    ...template.content.data,
                                    templateId: template.id
                                },
                                elements: []
                            }
                        }
                    }
                });
            }

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
                <PageTemplatesDialog onClose={closeTemplatesDialog} onSelect={onCreatePage} />
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
