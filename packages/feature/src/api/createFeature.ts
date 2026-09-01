import type { Container } from "@webiny/di";
import { FeatureLifecycle, type FeaturePhases } from "./FeatureLifecycle.js";

/**
 * A feature definition: `register` (always) plus the optional per-request phases.
 *
 * The conditional type exists for one reason — to make the second argument of `register` absent,
 * optional, or required depending on `TRegister`, so call sites get an accurate signature:
 *
 * | Declared as                             | `register` signature              |
 * |-----------------------------------------|-----------------------------------|
 * | `createFeature({...})`                  | `(container)`                     |
 * | `createFeature<ILicense \| undefined>()` | `(container, context?)`           |
 * | `createFeature<ApiCoreConfig>({...})`    | `(container, context)` — required |
 *
 * Two subtleties:
 * - `[TRegister] extends [void]` is wrapped in tuples to STOP distribution: a naked
 *   `TRegister extends void` would distribute over a union and evaluate per member.
 * - The `void` branch has to come first, because `undefined extends void` is true — checking
 *   `undefined extends TRegister` first would swallow the no-config case.
 */
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
