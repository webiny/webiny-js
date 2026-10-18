import type { Container } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { TEAMS_FEATURE_FLAG } from "~/constants.js";

/** The teams switch of a test: a fixed value, or a function read on every flag lookup. */
export type TeamsFlagValue = boolean | (() => boolean);

/**
 * Turns `advancedAccessControlLayer.teams` on or off for one test container (R311). Teams are on
 * by default in tests, because the test project license allows them; this forces them off or on.
 * Register it in `setup`; a decorator a test registers later wraps this one. Every other flag is answered by the decorated
 * implementation.
 */
export const setTeamsFlag = (container: Container, enabled: TeamsFlagValue): void => {
    class TeamsFlagFeatureFlags implements FeatureFlags.Interface {
        constructor(private decoratee: FeatureFlags.Interface) {}

        get(): ReturnType<FeatureFlags.Interface["get"]> {
            const flags = this.decoratee.get();
            const isEnabled = flags.isEnabled.bind(flags);
            flags.isEnabled = name => {
                if (name === TEAMS_FEATURE_FLAG) {
                    return typeof enabled === "function" ? enabled() : enabled;
                }
                return isEnabled(name);
            };
            return flags;
        }
    }

    container.registerDecorator(
        FeatureFlags.createDecorator({ decorator: TeamsFlagFeatureFlags, dependencies: [] })
    );
};
