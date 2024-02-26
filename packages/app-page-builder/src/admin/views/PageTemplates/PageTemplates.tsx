import React, { useCallback, useState, useMemo } from "react";
import get from "lodash/get";
import slugify from "slugify";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useMutation, useApolloClient, useQuery } from "@apollo/react-hooks";

import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { CreateTemplateDialog } from "@webiny/app-dynamic-pages/components/CreateTemplateDialog";
import { CmsModel } from "@webiny/app-headless-cms/types";

import PageTemplatesDataList from "./PageTemplatesDataList";
import PageTemplateDetails from "./PageTemplateDetails";
import { CreateStaticTemplateDialog } from "./CreateStaticTemplateDialog";
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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
    const [isCreateStaticDialogOpen, setIsCreateStaticDialogOpen] = useState<boolean>(false);
    const listQuery = useQuery(LIST_PAGE_TEMPLATES) || {};
    const pageTemplatesData: PbPageTemplate[] =
        listQuery?.data?.pageBuilder?.listPageTemplates?.data || [];

    const existingDynamicTemplateModelIds = useMemo(() => {
        return pageTemplatesData
            .filter(template => template.dynamicSource?.modelId)
            .map(template => template.dynamicSource?.modelId as string);
    }, [pageTemplatesData]);

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
            history.push(`/page-builder/template-editor/${data.id}`);
        } else {
            showSnackbar(error.message);
        }
    };

    const onCreateDynamicPageTemplate = useCallback(
        async (model: CmsModel) => {
            const existingDynamicTemplate = pageTemplatesData.find(
                template => template.dynamicSource?.modelId === model.modelId
            );

            if (existingDynamicTemplate) {
                history.push(`/page-builder/template-editor/${existingDynamicTemplate.id}`);
                return;
            }

            const templateSlug = slugify(model.name, {
                replacement: "-",
                lower: true,
                remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g,
                trim: false
            });
            const { data: res } = await client.mutate({
                mutation: CREATE_PAGE_TEMPLATE,
                variables: {
                    data: {
                        title: `${model.name} Page Template`,
                        slug: templateSlug,
                        description: "Dynamic page template",
                        tags: [],
                        layout: "static",
                        pageCategory: "static",
                        dynamicSource: {
                            modelId: model.modelId
                        }
                    }
                },
                refetchQueries: [{ query: LIST_PAGE_TEMPLATES }]
            });
            const { error, data } = get(res, `pageBuilder.pageTemplate`);
            if (data) {
                history.push(`/page-builder/template-editor/${data.id}`);
            } else {
                showSnackbar(error.message);
            }
        },
        [pageTemplatesData]
    );

    const [deleteIt, deleteMutation] = useMutation(DELETE_PAGE_TEMPLATE, {
        refetchQueries: [{ query: LIST_PAGE_TEMPLATES }]
    });

    const handleDeleteTemplateClick = useCallback(item => {
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

    const isLoading =
        Boolean([listQuery].find(item => item.loading)) || Boolean(deleteMutation?.loading);

    return (
        <>
            <SplitView>
                <LeftPanel>
                    <PageTemplatesDataList
                        pageTemplatesData={pageTemplatesData}
                        canCreate={canCreate()}
                        canEdit={record => canUpdate(record.createdBy?.id)}
                        canDelete={record => canDelete(record.createdBy?.id)}
                        onCreate={() => setIsCreateDialogOpen(true)}
                        onDelete={handleDeleteTemplateClick}
                        isLoading={isLoading}
                        refetch={listQuery.refetch}
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
            {isCreateDialogOpen && (
                <CreateTemplateDialog
                    onClose={() => setIsCreateDialogOpen(false)}
                    onSelect={onCreateDynamicPageTemplate}
                    onStaticTemplateSelect={() => {
                        setIsCreateDialogOpen(false);
                        setIsCreateStaticDialogOpen(true);
                    }}
                    existingDynamicTemplateModelIds={existingDynamicTemplateModelIds}
                />
            )}
            {isCreateStaticDialogOpen && (
                <CreateStaticTemplateDialog
                    onClose={() => setIsCreateStaticDialogOpen(false)}
                    onSubmit={onCreatePageTemplate}
                />
            )}
        </>
    );
};

export default PageTemplates;
