import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { FormBuilderContext } from "@webiny/api-form-builder/types";
import { AcoContext } from "@webiny/api-aco/types";
import { AdminUsersContext } from "@webiny/api-admin-users-cognito/types";
import { MailerContext } from "@webiny/api-mailer/types";
import { SecurityContext } from "@webiny/api-security/types";
import { PbImportExportContext } from "@webiny/api-page-builder-import-export/graphql/types";
import { ApwContext } from "@webiny/api-apw/types";
import { Context as BaseContext } from "@webiny/handler/types";

export type Action = {
    type: string;
    displayName: string;
};

export type Entity = {
    type: string;
    displayName: string;
    linkToEntity?: (id: string) => string;
    actions: Action[];
};

export type App = {
    app: string;
    displayName: string;
    entities: Entity[];
};

export type AuditLog = {
    id: string;
    message: string;
    app: string;
    entity: string;
    entityId: string;
    action: string;
    data: JSON;
    timestamp: Date;
    initiator: string;
};

export interface AuditLogsContext
    extends BaseContext,
        PbContext,
        FormBuilderContext,
        AcoContext,
        MailerContext,
        SecurityContext,
        AdminUsersContext,
        ApwContext {
    pageBuilder: PbImportExportContext["pageBuilder"];
    formBuilder: PbImportExportContext["formBuilder"];
}
