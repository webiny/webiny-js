import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AuditLogsContext } from "~/abstractions.js";
import { canAccessAuditLogs } from "~/features/shared/canAccessAuditLogs.js";
import { GetAuditLogUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetAuditLogUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private context: AuditLogsContext.Interface
    ) {}

    async execute(id: string): UseCaseAbstraction.Return {
        /* The check runs before the record is loaded, so the response does not reveal whether the ID exists. */
        if (!(await canAccessAuditLogs(this.identityContext))) {
            return Result.fail(
                new NotAuthorizedError({ message: "You cannot access audit logs." })
            );
        }

        try {
            return Result.ok(await this.context.auditLogs.getAuditLog(id));
        } catch (ex) {
            return Result.fail(ex);
        }
    }
}

export const GetAuditLogUseCaseImplementation = UseCaseAbstraction.createImplementation({
    implementation: GetAuditLogUseCaseImpl,
    dependencies: [IdentityContext, AuditLogsContext]
});
