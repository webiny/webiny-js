import type { TokenPath, TokenType } from "~/dtcg/types.js";
import { CANONICAL_COLOR_SLOT_PATHS } from "./colorSlots.js";
import { CANONICAL_TYPOGRAPHY_ROLE_PATHS } from "./typographyRoles.js";
import { RAMPS, rampStepPaths } from "./ramps.js";

export * from "./colorSlots.js";
export * from "./typographyRoles.js";
export * from "./ramps.js";

/**
 * Every canonical token path, in emission order, with the `$type` it must carry.
 *
 * A theme is never partially filled: creation seeds all of these from the default theme, and
 * publishing is blocked if any of them resolves to nothing.
 */
export interface CanonicalSlot {
    path: TokenPath;
    type: TokenType;
}

const rampSlots = (): CanonicalSlot[] => {
    return RAMPS.flatMap(ramp => rampStepPaths(ramp.id).map(path => ({ path, type: ramp.type })));
};

export const CANONICAL_SLOTS: readonly CanonicalSlot[] = [
    ...CANONICAL_COLOR_SLOT_PATHS.map(path => ({ path, type: "color" as const })),
    ...CANONICAL_TYPOGRAPHY_ROLE_PATHS.map(path => ({ path, type: "typography" as const })),
    ...rampSlots()
];

const CANONICAL_PATH_SET: ReadonlySet<TokenPath> = new Set(CANONICAL_SLOTS.map(slot => slot.path));

/**
 * True for core-owned slots. Canonical slots derive their variable name from their path and have
 * no immutable key — the path is the key, and it never changes.
 */
export const isCanonicalPath = (path: TokenPath): boolean => CANONICAL_PATH_SET.has(path);

export const getCanonicalSlot = (path: TokenPath): CanonicalSlot | undefined => {
    return CANONICAL_SLOTS.find(slot => slot.path === path);
};
