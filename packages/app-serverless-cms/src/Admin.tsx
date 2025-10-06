import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import type { AdminProps as BaseAdminProps } from "@webiny/app-admin";
import { Admin as BaseAdmin, AppInstaller } from "@webiny/app-admin";
import { Security } from "@webiny/app-security";
import { I18N } from "@webiny/app-i18n";
import { HeadlessCMS } from "@webiny/app-headless-cms";
import { AdminUI } from "@webiny/app-admin-ui";
import { FileManager } from "@webiny/app-file-manager/app.js";
import { GraphQLPlayground } from "@webiny/app-graphql-playground";
import { AccessManagement } from "@webiny/app-security-access-management";
import { imagePlugin } from "@webiny/app/plugins/index.js";
import fileStorageS3Plugin from "@webiny/app-file-manager-s3";
import { createApolloClient as defaultApolloClientFactory } from "./apolloClientFactory.js";
import apolloLinks from "./apolloLinks.js";
import { TenantManager } from "@webiny/app-tenant-manager";
import { AuditLogs } from "@webiny/app-audit-logs";
import { LexicalEditorActions } from "@webiny/lexical-editor-actions";
import { Module as MailerSettings } from "@webiny/app-mailer";
import { Websockets } from "@webiny/app-websockets";
import { RecordLocking } from "@webiny/app-record-locking";
import { TrashBinConfigs } from "@webiny/app-trash-bin";
import { AdvancedContentOrganisation } from "@webiny/app-aco";
import { Extension as WebsiteBuilder } from "@webiny/app-website-builder/Extension.js";
import { SchedulerConfigs } from "@webiny/app-headless-cms-scheduler";

export interface AdminProps extends Omit<BaseAdminProps, "createApolloClient"> {
    createApolloClient?: BaseAdminProps["createApolloClient"];
    children?: React.ReactNode;
}

const App = (props: AdminProps) => {
    const createApolloClient = props.createApolloClient || defaultApolloClientFactory;

    plugins.register(imagePlugin(), fileStorageS3Plugin(), apolloLinks);

    return (
        <BaseAdmin createApolloClient={createApolloClient}>
            <AdminUI />
            <Security />
            <AccessManagement />
            <AppInstaller />
            <FileManager />
            <GraphQLPlayground createApolloClient={createApolloClient} />
            <I18N />
            <Websockets />
            <RecordLocking />
            <LexicalEditorActions />
            <HeadlessCMS createApolloClient={createApolloClient} />
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
