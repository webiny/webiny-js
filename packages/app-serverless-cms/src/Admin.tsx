import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import type { AdminProps as BaseAdminProps } from "@webiny/app-admin";
import { Admin as BaseAdmin, AppInstaller, Provider } from "@webiny/app-admin";
import { Tenancy } from "@webiny/app-tenancy";
import { Security } from "@webiny/app-security";
import { I18N } from "@webiny/app-i18n";
import { I18NContent } from "@webiny/app-i18n-content";
import { HeadlessCMS } from "@webiny/app-headless-cms";
import { AdminUI } from "@webiny/app-admin-ui";
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
import { LexicalEditorActions } from "@webiny/lexical-editor-actions";
import { Module as MailerSettings } from "@webiny/app-mailer";
import { Websockets } from "@webiny/app-websockets";
import { RecordLocking } from "@webiny/app-record-locking";
import { TrashBinConfigs } from "@webiny/app-trash-bin";
import { AdvancedContentOrganisation } from "@webiny/app-aco";
import { Extension as WebsiteBuilder } from "@webiny/app-website-builder/Extension";
import { SchedulerConfigs } from "@webiny/app-headless-cms-scheduler/index.js";

export interface AdminProps extends Omit<BaseAdminProps, "createApolloClient"> {
    createApolloClient?: BaseAdminProps["createApolloClient"];
    children?: React.ReactNode;
}

const App = (props: AdminProps) => {
    const createApolloClient = props.createApolloClient || defaultApolloClientFactory;
    const ViewCompositionProvider = createViewCompositionProvider();

    plugins.register(imagePlugin(), fileStorageS3Plugin(), apolloLinks);

    return (
        <BaseAdmin createApolloClient={createApolloClient}>
            <AdminUI />
            <Tenancy />
            <Security />
            <AccessManagement />
            <AppInstaller />
            <FileManager />
            <GraphQLPlayground createApolloClient={createApolloClient} />
            <I18N />
            <I18NContent />
            <Provider hoc={ViewCompositionProvider} />
            <Websockets />
            <RecordLocking />
            <LexicalEditorActions />
            <HeadlessCMS createApolloClient={createApolloClient} />
            <AdvancedPublishingWorkflow />
            <TenantManager />
            <AuditLogs />
            <MailerSettings />
            <SchedulerConfigs />
            <TrashBinConfigs />
            <AdvancedContentOrganisation />
            <WebsiteBuilder />
            {props.children}
        </BaseAdmin>
    );
};

export const Admin = memo<AdminProps>(App);
