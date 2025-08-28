import type {
    AuditLogPayload,
    AuditLogsContext,
    AuditLogsContextValue,
    IListAuditLogsParams,
    IListAuditLogsResult,
    OnAuditLogBeforeCreateTopicParams,
    OnAuditLogBeforeUpdateTopicParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { convertExpiresAtDaysToDate } from "~/utils/expiresAt.js";
import type { IAuditLog, IAuditLogCreatedBy } from "~/storage/types.js";
import { mdbid } from "@webiny/utils/mdbid.js";
import type { IStorage, IStorageListParams } from "~/storage/abstractions/Storage.js";
import { NotAuthorizedError } from "@webiny/api-security";

export interface IAuditLogsContextValueParams {
    getContext: () => AuditLogsContext;
    deleteLogsAfterDays?: number;
    storage: IStorage;
}

class AuditLogsContextValueImpl implements AuditLogsContextValue {
    private readonly getContext;
    public readonly deleteLogsAfterDays;
    public readonly onBeforeCreate;
    public readonly onBeforeUpdate;
    private readonly storage: IStorage;

    public constructor(params: IAuditLogsContextValueParams) {
        this.getContext = params.getContext;
        this.deleteLogsAfterDays = params.deleteLogsAfterDays;
        this.onBeforeCreate = createTopic<OnAuditLogBeforeCreateTopicParams>(
            "auditLogs.onBeforeCreate"
        );
        this.onBeforeUpdate = createTopic<OnAuditLogBeforeUpdateTopicParams>(
            "auditLogs.onBeforeUpdate"
        );
        this.storage = params.storage;
    }

    public async createAuditLog(payload: AuditLogPayload): Promise<IAuditLog> {
        const context = this.getContext();
        const expiresAt = convertExpiresAtDaysToDate(this.deleteLogsAfterDays);

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

        await this.onBeforeCreate.publish({
            auditLog,
            context,
            setAuditLog(input) {
                Object.assign(auditLog, input);
            }
        });

        const result = await this.storage.store({
            data: auditLog
        });
        if (result.success) {
            return result.data;
        }
        throw result.error;
    }

    public async updateAuditLog(
        original: IAuditLog,
        payload: Partial<AuditLogPayload>
    ): Promise<IAuditLog> {
        const context = this.getContext();
        const auditLog: IAuditLog = {
            ...original,
            ...payload,
            content: payload.content ? JSON.stringify(payload.content) : original.content
        };
        await this.checkPermissions(auditLog);

        await this.onBeforeUpdate.publish({
            original,
            auditLog,
            context,
            setAuditLog(input) {
                Object.assign(auditLog, input);
            }
        });

        const result = await this.storage.store({
            data: auditLog
        });
        if (result.success) {
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
        const permissions = await this.getContext().security.getPermissions("al.*");
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
        return this.getContext().tenancy.getCurrentTenant().id;
    }

    private getIdentity(): IAuditLogCreatedBy {
        const identity = this.getContext().security.getIdentity();
        return {
            id: identity.id,
            type: identity.type,
            displayName: identity.displayName || "unknown"
        };
    }
}

export const createAuditLogsContextValue = (
    params: IAuditLogsContextValueParams
): AuditLogsContextValue => {
    return new AuditLogsContextValueImpl(params);
};
