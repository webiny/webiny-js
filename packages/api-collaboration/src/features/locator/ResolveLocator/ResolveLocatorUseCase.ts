import { Result } from "@webiny/feature/api";
import { CollabLocatorResolver } from "~/domain/locator/abstractions.js";
import { CollabResolverNotFoundError } from "~/domain/locator/errors.js";
import { ResolveLocatorUseCase as UseCase } from "./abstractions.js";

class ResolveLocatorUseCaseImpl implements UseCase.Interface {
    private readonly resolvers;

    constructor(resolvers: CollabLocatorResolver.Interface[]) {
        this.resolvers = resolvers;
    }

    async execute(params: UseCase.Params): UseCase.Return {
        const resolver = this.resolvers.find(item => item.contentType === params.contentType);
        if (!resolver) {
            return Result.fail(new CollabResolverNotFoundError(params.contentType));
        }

        const resolution = await resolver.resolve(params);
        return Result.ok(resolution);
    }
}

export const ResolveLocatorUseCase = UseCase.createImplementation({
    implementation: ResolveLocatorUseCaseImpl,
    dependencies: [[CollabLocatorResolver, { multiple: true }]]
});
