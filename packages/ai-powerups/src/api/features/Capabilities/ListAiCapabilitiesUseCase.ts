import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AiCapability, ListAiCapabilitiesUseCase } from "./abstractions.js";
import type { IAiCapabilitySummary } from "./abstractions.js";

/**
 * Lists the registered capabilities for callers outside the api.
 *
 * The mapping lives here rather than in the GraphQL resolver so the shape sent over the wire is
 * decided once, next to the abstraction it describes. It also keeps `guidance` from leaking: a
 * capability's prompt is implementation, and the summary simply has no field for it.
 */
class ListAiCapabilitiesUseCaseImpl implements ListAiCapabilitiesUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private capabilities: AiCapability.Interface[]
    ) {}

    async execute(): Promise<Result<IAiCapabilitySummary[], Error>> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        return Result.ok(
            this.capabilities.map(capability => ({
                id: capability.id,
                label: capability.label,
                description: capability.description,
                defaultRole: capability.defaultRole
            }))
        );
    }
}

export const ListAiCapabilitiesUseCaseImplementation =
    ListAiCapabilitiesUseCase.createImplementation({
        implementation: ListAiCapabilitiesUseCaseImpl,
        dependencies: [IdentityContext, [AiCapability, { multiple: true }]]
    });
