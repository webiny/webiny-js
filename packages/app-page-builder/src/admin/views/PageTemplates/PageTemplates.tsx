import React, { useCallback } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useMutation, useApolloClient } from "@apollo/react-hooks";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useStateWithCallback } from "@webiny/app-admin/hooks";
import PageTemplatesDataList from "./PageTemplatesDataList";
import PageTemplateDetails from "./PageTemplateDetails";
import CreatePageTemplateDialog from "./CreatePageTemplateDialog";
import { PbPageTemplate } from "~/types";
import { LIST_PAGE_TEMPLATES, CREATE_PAGE_TEMPLATE, DELETE_PAGE_TEMPLATE } from "./graphql";
import { useTemplatesPermissions } from "~/hooks/permissions";

const t = i18n.ns("app-page-builder/admin/views/page-templates");

export interface CreatableItem {
    createdBy?: {
        id?: string;
    };
}

const PageTemplates = () => {
    const { history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useStateWithCallback<boolean>(false);

    const { canCreate, canUpdate, canDelete } = useTemplatesPermissions();

    const onCreatePageTemplate = async (
        formData: Pick<PbPageTemplate, "title" | "slug" | "description">
    ) => {
        const { data: res } = await client.mutate({
            mutation: CREATE_PAGE_TEMPLATE,
            variables: {
                data: {
                    title: formData.title,
                    slug: formData.slug,
                    description: formData.description,
                    tags: [],
                    layout: "static", // Hardcoded until better UI is in place
                    pageCategory: "static"
                }
            },
            refetchQueries: [{ query: LIST_PAGE_TEMPLATES }]
        });

        const { error, data } = get(res, `pageBuilder.pageTemplate`);
        if (data) {
            setIsCreateDialogOpen(false, () => {
                history.push(`/page-builder/template-editor/${data.id}`);
            });
        } else {
            showSnackbar(error.message);
        }
    };

    const [deleteIt, deleteMutation] = useMutation(DELETE_PAGE_TEMPLATE, {
        refetchQueries: [{ query: LIST_PAGE_TEMPLATES }]
    });

    const handleDeleteTemplateClick = useCallback((item: PbPageTemplate) => {
        showConfirmation(async () => {
            const response = await deleteIt({
                variables: { id: item.id }
            });

            const error = response?.data?.pageBuilder?.deletePageTemplate?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            history.push("/page-builder/page-templates");

            showSnackbar(t`Template "{title}" deleted.`({ title: item.title }));
        });
    }, []);

    return (
        <>
            <SplitView>
                <LeftPanel>
                    <PageTemplatesDataList
                        canCreate={canCreate()}
                        canEdit={record => canUpdate(record.createdBy?.id)}
                        canDelete={record => canDelete(record.createdBy?.id)}
                        onCreate={() => setIsCreateDialogOpen(true)}
                        onDelete={handleDeleteTemplateClick}
                        isLoading={deleteMutation?.loading}
                    />
                </LeftPanel>
                <RightPanel>
                    <PageTemplateDetails
                        canCreate={canCreate()}
                        canEdit={record => canUpdate(record.createdBy?.id)}
                        canDelete={record => canDelete(record.createdBy?.id)}
                        onCreate={() => setIsCreateDialogOpen(true)}
                        onDelete={handleDeleteTemplateClick}
                    />
                </RightPanel>
            </SplitView>
            <CreatePageTemplateDialog
                open={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSubmit={onCreatePageTemplate}
            />
        </>
    );
};

export default PageTemplates;
