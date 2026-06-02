import React, { memo } from "react";
import type { AdminProps as BaseAdminProps } from "@webiny/app-admin";
import { Admin as BaseAdmin, SystemInstallerProvider } from "@webiny/app-admin";
import { HeadlessCMS } from "@webiny/app-headless-cms";
import { AdminUI } from "@webiny/app-admin-ui";
import { FileManager } from "@webiny/app-file-manager/app.js";
import { GraphQLPlayground } from "@webiny/app-graphql-playground";
import { SdkPlayground } from "@webiny/app-sdk-playground";
import { AccessManagement } from "@webiny/app-security-access-management";
import { imagePlugin } from "@webiny/app/plugins/index.js";
import fileStorageS3Plugin from "@webiny/app-file-manager-s3";
import { createApolloClient } from "./apolloClientFactory.js";
import apolloLinks from "./apolloLinks.js";
import { AuditLogs } from "@webiny/app-audit-logs";
import { LexicalEditorActions } from "@webiny/lexical-editor-actions";
import { Module as MailerSettings } from "@webiny/app-mailer";
import { Websockets } from "@webiny/app-websockets";
import { RecordLocking } from "@webiny/app-record-locking";
import { TrashBinConfigs } from "@webiny/app-admin/presentation/trashBin/index.js";
import { AdvancedContentOrganisation } from "@webiny/app-aco";
import { Extension as WebsiteBuilder } from "@webiny/app-website-builder/Extension.js";
import { SchedulerConfigs } from "@webiny/app-scheduler";
import { CmsScheduler } from "@webiny/app-headless-cms-scheduler";
import { Components as WorkflowComponents } from "@webiny/app-workflows";
import { CmsWorkflows } from "@webiny/app-headless-cms-workflows";
import { WebsiteBuilderWorkflows } from "@webiny/app-website-builder-workflows";
import { Container } from "@webiny/di";
import type { PluginCollection } from "@webiny/plugins/types.js";
import { WbScheduler } from "@webiny/app-website-builder-scheduler";
import { Webhooks } from "@webiny/webhooks/admin";
import { BackgroundTasks } from "@webiny/background-tasks/admin";

export interface AdminProps extends Omit<
    BaseAdminProps,
    "createApolloClient" | "createLegacyPlugins"
> {
    children?: React.ReactNode;
}

const App = (props: AdminProps) => {
    const createLegacyPlugins = (container: Container): PluginCollection => {
        return [imagePlugin(), fileStorageS3Plugin(), apolloLinks(container)];
    };

    return (
        <BaseAdmin
            createApolloClient={createApolloClient}
            createLegacyPlugins={createLegacyPlugins}
        >
            <AdminUI />
            <AccessManagement />
            <SystemInstallerProvider />
            <FileManager />
            <GraphQLPlayground createApolloClient={createApolloClient} />
            <SdkPlayground />
            <Websockets />
            <RecordLocking />
            <LexicalEditorActions />
            <HeadlessCMS createApolloClient={createApolloClient} />
            <AuditLogs />
            <MailerSettings />
            <SchedulerConfigs />
            <CmsScheduler />
            <TrashBinConfigs />
            <AdvancedContentOrganisation />
            <WebsiteBuilder />
            <WorkflowComponents.App.WorkflowsAdminApp />
            <CmsWorkflows />
            <WebsiteBuilderWorkflows />
            <WbScheduler />
            <Webhooks />
            <BackgroundTasks />
            {props.children}
        </BaseAdmin>
    );
};

export const Admin = memo<AdminProps>(App);
