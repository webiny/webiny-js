import { mdbid } from "@webiny/utils/mdbid.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { AuditLogs as Abstraction } from "~/abstractions.js";
import { AuditLogsConfig } from "~/abstractions.js";
import { AuditLogsStorage } from "~/abstractions.js";
import type { AuditLogPayload } from "~/types.js";
import type { IListAuditLogsParams } from "~/types.js";
import type { IListAuditLogsResult } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { IAuditLogCreatedBy } from "~/storage/types.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import { convertExpiresAtDaysToDate } from "~/utils/expiresAt.js";
import { AuditLogBeforeCreateEvent } from "~/events/index.js";
import { AuditLogAfterCreateEvent } from "~/events/index.js";
import { AuditLogBeforeUpdateEvent } from "~/events/index.js";
import { AuditLogAfterUpdateEvent } from "~/events/index.js";

class AuditLogsImpl implements Abstraction.Interface {
    public constructor(
        private readonly storage: AuditLogsStorage.Interface,
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly config: AuditLogsConfig.Interface
    ) {}

    public async createAuditLog(payload: AuditLogPayload): Promise<IAuditLog> {
        const expiresAt = convertExpiresAtDaysToDate(this.config.deleteLogsAfterDays);

        const auditLog: IAuditLog = {
            id: mdbid(),
            tenant: this.getTenantId(),
            createdBy: this.getIdentity(),
            createdOn: new Date(),
            ...payload,
            content: JSON.stringify(payload.content),
            expiresAt
        };
        await this.checkPermissions(auditLog);

        const beforeCreateEvent = new AuditLogBeforeCreateEvent({
            auditLog: auditLog,
            setAuditLog(input) {
                Object.assign(auditLog, input);
            }
        });
        await this.eventPublisher.publish(beforeCreateEvent);

        const result = await this.storage.store({
            data: auditLog
        });
        if (result.success) {
            const afterCreateEvent = new AuditLogAfterCreateEvent({
                auditLog: auditLog
            });
            await this.eventPublisher.publish(afterCreateEvent);
            return result.data;
        }
        throw result.error;
    }

    public async updateAuditLog(
        original: IAuditLog,
        payload: Partial<AuditLogPayload>
    ): Promise<IAuditLog> {
        const auditLog: IAuditLog = {
            ...original,
            ...payload,
            content: payload.content ? JSON.stringify(payload.content) : original.content
        };
        await this.checkPermissions(auditLog);

        const beforeUpdateEvent = new AuditLogBeforeUpdateEvent({
            original,
            auditLog,
            setAuditLog(input) {
                Object.assign(auditLog, input);
            }
        });
        await this.eventPublisher.publish(beforeUpdateEvent);

        const result = await this.storage.store({
            data: auditLog
        });
        if (result.success) {
            const afterUpdateEvent = new AuditLogAfterUpdateEvent({
                original: original,
                auditLog: auditLog
            });
            await this.eventPublisher.publish(afterUpdateEvent);
            return result.data;
        }
        throw result.error;
    }

    public async getAuditLog(id: string): Promise<IAuditLog | null> {
        const result = await this.storage.fetch({
            id,
            tenant: this.getTenantId()
        });
        if (result.success) {
            await this.checkPermissions(result.data);
            return result.data;
        }
        throw result.error;
    }

    public async listAuditLogs(params: IListAuditLogsParams): Promise<IListAuditLogsResult> {
        const result = await this.storage.list({
            ...params,
            tenant: this.getTenantId()
        } as unknown as IStorageListParams);
        if (result.success) {
            return {
                items: result.data,
                meta: {
                    cursor: result.meta.after || null,
                    hasMoreItems: result.meta.hasMoreItems
                }
            };
        }
        throw result.error;
    }

    private async checkPermissions(auditLog: Pick<IAuditLog, "action">): Promise<void> {
        if (!auditLog.action) {
            throw new Error("Audit log action is not defined. Cannot check permissions.");
        }
        const permissions = await this.identityContext.getPermissions("al.*");
        for (const permission of permissions) {
            if (permission.name === "*") {
                return;
            }
            if (permission.name === "al.*") {
                return;
            } else if (permission.name === `al.${auditLog.action}`) {
                return;
            }
        }

        throw new NotAuthorizedError({
            message: "You cannot access audit logs."
        });
    }

    private getTenantId(): string {
        return this.tenantContext.getTenant().id;
    }

    private getIdentity(): IAuditLogCreatedBy {
        const identity = this.identityContext.getIdentity();
        return {
            id: identity.id,
            type: identity.type,
            displayName: identity.displayName || "unknown"
        };
    }
}

export const AuditLogs = Abstraction.createImplementation({
    implementation: AuditLogsImpl,
    dependencies: [
        AuditLogsStorage,
        EventPublisher,
        IdentityContext,
        TenantContext,
        AuditLogsConfig
    ]
});
