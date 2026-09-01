import type { Container } from "@webiny/di";
import { FeatureLifecycle, type FeaturePhases } from "./FeatureLifecycle.js";

export type FeatureDefinition<TRegister = void> = FeaturePhases &
    ([TRegister] extends [void]
        ? {
              name: string;
              register(container: Container): void;
          }
        : undefined extends TRegister
          ? {
                name: string;
                register(container: Container, context?: TRegister): void;
            }
          : {
                name: string;
                register(container: Container, context: TRegister): void;
            });

export function createFeature<TRegister = void>(
    def: FeatureDefinition<TRegister>
): FeatureDefinition<TRegister> {
    const { name, setup, afterSetup } = def;
    const register = def.register as (container: Container, context?: TRegister) => void;
    const hasPhases = Boolean(setup || afterSetup);

    const feature = {
        name,
        register(container: Container, context?: TRegister) {
            register(container, context);

            // Stash the per-request phases so the runner can find them later. Kept inside
            // `register` on purpose: a feature that never registers (e.g. a parent gated it behind
            // a license check) never contributes phases either.
            if (hasPhases) {
                container.registerInstance(FeatureLifecycle, { name, setup, afterSetup });
            }
        }
    };

    Reflect.defineMetadata("wby:isFeature", true, feature);

    return feature as FeatureDefinition<TRegister>;
}
