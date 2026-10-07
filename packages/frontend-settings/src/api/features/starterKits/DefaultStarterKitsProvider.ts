import { StarterKitsProvider as ProviderAbstraction } from "./abstractions.js";
import type { IStarterKit } from "~/shared/types.js";

/**
 * Base implementation, returning no starter kits.
 *
 * Starter kits are contributed by the packages that own them (for example,
 * `@webiny/api-website-builder` registers the Next.js and Nuxt kits via a
 * decorator). This keeps `frontend-settings` free of dependencies on those
 * packages, which already depend on it.
 */
class DefaultStarterKitsProviderImpl implements ProviderAbstraction.Interface {
    async execute(): Promise<IStarterKit[]> {
        return [];
    }
}

export const DefaultStarterKitsProvider = ProviderAbstraction.createImplementation({
    implementation: DefaultStarterKitsProviderImpl,
    dependencies: []
});
