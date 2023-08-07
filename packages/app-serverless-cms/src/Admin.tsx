import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import {
    Admin as BaseAdmin,
    AdminProps as BaseAdminProps,
    AppInstaller,
    Provider
} from "@webiny/app-admin";
import { Tenancy } from "@webiny/app-tenancy";
import { Security } from "@webiny/app-security";
import { I18N } from "@webiny/app-i18n";
import { I18NContent } from "@webiny/app-i18n-content";
import { PageBuilder } from "@webiny/app-page-builder";
import { FormBuilder } from "@webiny/app-form-builder";
import { HeadlessCMS } from "@webiny/app-headless-cms";
import { RMWC } from "@webiny/app-admin-rmwc";
import { FileManager } from "@webiny/app-file-manager/app";
import { GraphQLPlayground } from "@webiny/app-graphql-playground";
import { AccessManagement } from "@webiny/app-security-access-management";
import { imagePlugin } from "@webiny/app/plugins";
import fileStorageS3Plugin from "@webiny/app-file-manager-s3";
import { createApolloClient as defaultApolloClientFactory } from "./apolloClientFactory";
import apolloLinks from "./apolloLinks";
import { createViewCompositionProvider } from "@webiny/app-admin/base/providers/ViewCompositionProvider";
import { AdvancedPublishingWorkflow } from "@webiny/app-apw";
import { TenantManager } from "@webiny/app-tenant-manager";
import { AuditLogs } from "@webiny/app-audit-logs";
import { LexicalEditorPlugin } from "@webiny/lexical-editor-pb-element";
import { LexicalEditorActions } from "@webiny/lexical-editor-actions";
import { Module as MailerSettings } from "@webiny/app-mailer";
import { Folders } from "@webiny/app-aco";

export interface AdminProps extends Omit<BaseAdminProps, "createApolloClient"> {
    createApolloClient?: BaseAdminProps["createApolloClient"];
}

const App = (props: AdminProps) => {
    const createApolloClient = props.createApolloClient || defaultApolloClientFactory;
    const ViewCompositionProvider = createViewCompositionProvider();

    plugins.register(imagePlugin(), fileStorageS3Plugin(), apolloLinks);

    return (
        <BaseAdmin createApolloClient={createApolloClient}>
            <RMWC />
            <Tenancy />
            <Security />
            <AccessManagement />
            <AppInstaller />
            <Folders />
            <FileManager />
            <GraphQLPlayground createApolloClient={createApolloClient} />
            <I18N />
            <I18NContent />
            <Provider hoc={ViewCompositionProvider} />
            <PageBuilder />
            <LexicalEditorPlugin />
            <LexicalEditorActions />
            <FormBuilder />
            <HeadlessCMS createApolloClient={createApolloClient} />
            <AdvancedPublishingWorkflow />
            <TenantManager />
            <AuditLogs />
            <MailerSettings />
            {props.children}
        </BaseAdmin>
    );
};

export const Admin = memo<AdminProps>(App);
