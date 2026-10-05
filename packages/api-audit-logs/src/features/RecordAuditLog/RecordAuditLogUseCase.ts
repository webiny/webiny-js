import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CreateAuditLogUseCase } from "~/features/CreateAuditLog/abstractions.js";
import { ListAuditLogsUseCase } from "~/features/ListAuditLogs/abstractions.js";
import { UpdateAuditLogUseCase } from "~/features/UpdateAuditLog/abstractions.js";
import type { AuditLogPayload } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import { RecordAuditLogUseCase as UseCaseAbstraction } from "./abstractions.js";

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
 * newer than the delay, instead of creating a new one. A failure on that path is logged and
 * nothing is recorded.
 */
class RecordAuditLogUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly createAuditLog: CreateAuditLogUseCase.Interface,
        private readonly listAuditLogs: ListAuditLogsUseCase.Interface,
        private readonly updateAuditLog: UpdateAuditLogUseCase.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<IAuditLog | null, UseCaseAbstraction.Error>> {
        const { audit, message, content, entityId } = input;

        if (!this.identityContext.getIdentity()?.id) {
            this.logger.debug("No identity, skipping audit log creation.");
            return Result.ok(null);
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
                    return Result.ok(null);
                }
            }
            return await this.createAuditLog.execute(payload);
        });
    }

    private async createOrMergeAuditLog(
        payload: AuditLogPayload,
        delay: number
    ): Promise<Result<IAuditLog | null, UseCaseAbstraction.Error>> {
        const createdOnGte = createAuditLogDelayDate(delay);
        const listResult = await this.listAuditLogs.execute({
            app: payload.app,
            entityId: payload.entityId,
            limit: 1,
            createdOn_gte: createdOnGte,
            sort: "DESC"
        });
        if (listResult.isFail()) {
            this.logger.warn(
                { error: listResult.error },
                "Could not list audit logs to merge into."
            );
            return Result.ok(null);
        }

        const original = listResult.value.items[0];
        if (!original) {
            const createResult = await this.createAuditLog.execute(payload);
            if (createResult.isFail()) {
                this.logger.warn({ error: createResult.error }, "Could not create an audit log.");
                return Result.ok(null);
            }
            return Result.ok(createResult.value);
        }

        // Update the latest audit log with the new "after" payload, keeping its original "before".
        // Only the message and the content change: the original log keeps everything else,
        // including any tags it was created with.
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

        const updateResult = await this.updateAuditLog.execute(original, {
            message: payload.message,
            content
        });
        if (updateResult.isFail()) {
            this.logger.warn({ error: updateResult.error }, "Could not merge an audit log.");
            return Result.ok(null);
        }

        return Result.ok(updateResult.value);
    }
}

export const RecordAuditLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: RecordAuditLogUseCaseImpl,
    dependencies: [
        CreateAuditLogUseCase,
        ListAuditLogsUseCase,
        UpdateAuditLogUseCase,
        IdentityContext,
        Logger
    ]
});
