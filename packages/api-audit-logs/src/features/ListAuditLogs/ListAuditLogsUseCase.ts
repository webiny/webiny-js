import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AuditLogsContext } from "~/abstractions.js";
import { canAccessAuditLogs } from "~/features/shared/canAccessAuditLogs.js";
import { ListAuditLogsUseCase as UseCaseAbstraction } from "./abstractions.js";

/**
 * Lists the audit logs for the API. Internal code that needs the logs regardless of who triggered
 * it (e.g. merging of the recent logs) reads them through `context.auditLogs`.
 */
class ListAuditLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private context: AuditLogsContext.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        if (!(await canAccessAuditLogs(this.identityContext))) {
            return Result.fail(
                new NotAuthorizedError({ message: "You cannot access audit logs." })
            );
        }

        try {
            const result = await this.context.auditLogs.listAuditLogs(params);
            if (result.error) {
                return Result.fail(result.error);
            }

            return Result.ok({
                items: result.items,
                meta: result.meta
            });
        } catch (ex) {
            return Result.fail(ex);
        }
    }
}

export const ListAuditLogsUseCaseImplementation = UseCaseAbstraction.createImplementation({
    implementation: ListAuditLogsUseCaseImpl,
    dependencies: [IdentityContext, AuditLogsContext]
});
