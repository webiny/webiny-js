import WebinyError from "@webiny/error";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AuditLogRecorder as Abstraction } from "~/abstractions.js";
import { AuditLogs } from "~/abstractions.js";
import type { AuditLogPayload } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";

const createAuditLogDelayDate = (delay: number): Date => {
    const date = new Date();
    date.setTime(date.getTime() - delay * 1000);
    return date;
};

/**
 * Records audit logs for things the current identity did. Writes happen without authorization,
 * because the identity doing the audited action doesn't need audit log permissions.
 *
 * An action with a `newEntryDelay` merges into the entity's latest audit log when that log is
 * newer than the delay, instead of creating a new one.
 */
class AuditLogRecorderImpl implements Abstraction.Interface {
    public constructor(
        private readonly auditLogs: AuditLogs.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async record(params: Abstraction.Params): Promise<IAuditLog | null> {
        const { audit, message, content, entityId } = params;

        if (!audit) {
            this.logger.warn("No audit action defined, skipping audit log creation.");
            return null;
        }

        if (!this.identityContext.getIdentity()?.id) {
            this.logger.debug("No identity, skipping audit log creation.");
            return null;
        }

        const payload: AuditLogPayload = {
            message,
            app: audit.app.app,
            entityId,
            entity: audit.entity.type,
            action: audit.action.type,
            content,
            tags: []
        };

        const delay = audit.action.newEntryDelay || 0;

        return await this.identityContext.withoutAuthorization(async () => {
            if (delay > 0) {
                try {
                    return await this.createOrMergeAuditLog(payload, delay);
                } catch (error) {
                    this.logger.warn({ error }, "Could not create or merge an audit log.");
                }
                return null;
            }
            return await this.createAuditLog(payload);
        });
    }

    private async createAuditLog(payload: AuditLogPayload): Promise<IAuditLog> {
        try {
            return await this.auditLogs.createAuditLog(payload);
        } catch (error) {
            throw WebinyError.from(error);
        }
    }

    private async createOrMergeAuditLog(
        payload: AuditLogPayload,
        delay: number
    ): Promise<IAuditLog> {
        const createdOnGte = createAuditLogDelayDate(delay);
        const results = await this.auditLogs.listAuditLogs({
            app: payload.app,
            entityId: payload.entityId,
            limit: 1,
            createdOn_gte: createdOnGte,
            sort: "DESC"
        });
        if (results.error) {
            throw WebinyError.from(results.error);
        }
        const original = results.items?.[0];
        if (!original) {
            return this.createAuditLog(payload);
        }

        // Update the latest audit log with the new "after" payload, keeping its original "before".
        let content = payload.content;
        if (original.content) {
            const beforePayloadData = JSON.parse(original.content)?.before;
            if (beforePayloadData) {
                content = {
                    before: beforePayloadData,
                    after: payload.content?.after
                };
            }
        }

        try {
            return await this.auditLogs.updateAuditLog(original, {
                ...payload,
                content
            });
        } catch (error) {
            throw WebinyError.from(error);
        }
    }
}

export const AuditLogRecorder = Abstraction.createImplementation({
    implementation: AuditLogRecorderImpl,
    dependencies: [AuditLogs, IdentityContext, Logger]
});
