import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { FormBuilderContext } from "@webiny/api-form-builder/types";
import { AcoContext } from "@webiny/api-aco/types";
import { MailerContext } from "@webiny/api-mailer/types";
import { SecurityContext } from "@webiny/api-security/types";
import { PbImportExportContext } from "@webiny/api-page-builder-import-export/graphql/types";
import { ApwContext } from "@webiny/api-apw/types";
import { Context as BaseContext } from "@webiny/handler/types";

export * from "~/app/types";

export interface Action {
    type: string;
    displayName: string;
    /**
     * Delay in seconds before a new audit log can be created.
     * During this delay actions will update existing audit log instead of creating new ones.
     */
    newEntryDelay?: number;
}

export interface Entity {
    type: string;
    displayName: string;
    linkToEntity?: (id: string) => string;
    actions: Action[];
}

export interface App {
    app: string;
    displayName: string;
    entities: Entity[];
}

export interface AuditLog {
    id: string;
    message: string;
    app: string;
    entity: string;
    entityId: string;
    action: string;
    data: JSON;
    timestamp: Date;
    initiator: string;
}

export interface AuditLogsContext
    extends BaseContext,
        PbContext,
        FormBuilderContext,
        AcoContext,
        MailerContext,
        SecurityContext,
        ApwContext {
    pageBuilder: PbImportExportContext["pageBuilder"];
    formBuilder: PbImportExportContext["formBuilder"];
}

export interface AuditObject {
    [app: string]: EntityObject;
}

export interface EntityObject {
    [entity: string]: ActionObject;
}

export interface ActionObject {
    [action: string]: AuditAction;
}

export interface AuditAction {
    app: App;
    entity: Entity;
    action: Action;
}
