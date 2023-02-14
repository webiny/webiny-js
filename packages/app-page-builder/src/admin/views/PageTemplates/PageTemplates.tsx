import React, { useMemo, useCallback } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useMutation, useApolloClient } from "@apollo/react-hooks";

import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

import PageTemplatesDataList from "./PageTemplatesDataList";
import PageTemplateDetails from "./PageTemplateDetails";
import { PageBuilderSecurityPermission } from "~/types";
import { LIST_PAGE_TEMPLATES, CREATE_PAGE_TEMPLATE, DELETE_PAGE_TEMPLATE } from "./graphql";

const t = i18n.ns("app-page-builder/admin/views/page-templates");

export interface CreatableItem {
    createdBy?: {
        id?: string;
    };
}

const PageTemplates: React.FC = () => {
    const { identity, getPermission } = useSecurity();
    const { history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();

    const pbPageTemplatePermission = useMemo((): PageBuilderSecurityPermission | null => {
        return getPermission("pb.template");
    }, [identity]);

    const canCreate = useMemo((): boolean => {
        if (!pbPageTemplatePermission) {
            return false;
        }
        if (typeof pbPageTemplatePermission.rwd === "string") {
            return pbPageTemplatePermission.rwd.includes("w");
        }
        return true;
    }, []);

    const canEdit = useCallback((item: CreatableItem): boolean => {
        if (!pbPageTemplatePermission) {
            return false;
        }
        if (pbPageTemplatePermission.own) {
            const identityId = identity ? identity.id || identity.login : null;
            return item.createdBy?.id === identityId;
        }
        if (typeof pbPageTemplatePermission.rwd === "string") {
            return pbPageTemplatePermission.rwd.includes("w");
        }

        return true;
    }, []);

    const canDelete = useCallback((item: CreatableItem): boolean => {
        if (!pbPageTemplatePermission) {
            return false;
        }
        if (pbPageTemplatePermission.own) {
            const identityId = identity ? identity.id || identity.login : null;
            return item.createdBy?.id === identityId;
        }
        if (typeof pbPageTemplatePermission.rwd === "string") {
            return pbPageTemplatePermission.rwd.includes("d");
        }

        return true;
    }, []);

    const onCreatePageTemplate = async () => {
        const { data: res } = await client.mutate({
            mutation: CREATE_PAGE_TEMPLATE,
            variables: {
                data: {
                    title: "New template"
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

    const handleNewTemplateClick = useCallback(() => {
        onCreatePageTemplate();
    }, []);

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

    return (
        <SplitView>
            <LeftPanel>
                <PageTemplatesDataList
                    canCreate={canCreate}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onCreate={handleNewTemplateClick}
                    onDelete={handleDeleteTemplateClick}
                    isLoading={deleteMutation?.loading}
                />
            </LeftPanel>
            <RightPanel>
                <PageTemplateDetails
                    canCreate={canCreate}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onCreate={handleNewTemplateClick}
                    onDelete={handleDeleteTemplateClick}
                />
            </RightPanel>
        </SplitView>
    );
};

export default PageTemplates;
