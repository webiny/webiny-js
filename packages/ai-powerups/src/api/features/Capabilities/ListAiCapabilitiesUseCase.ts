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
    constructor(private capabilities: AiCapability.Interface[]) {}

    async execute(): Promise<IAiCapabilitySummary[]> {
        return this.capabilities.map(capability => ({
            id: capability.id,
            label: capability.label,
            description: capability.description,
            defaultRole: capability.defaultRole
        }));
    }
}

export const ListAiCapabilitiesUseCaseImplementation =
    ListAiCapabilitiesUseCase.createImplementation({
        implementation: ListAiCapabilitiesUseCaseImpl,
        dependencies: [[AiCapability, { multiple: true }]]
    });
