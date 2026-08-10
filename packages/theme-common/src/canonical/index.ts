import type { TokenPath, TokenType } from "~/dtcg/types.js";
import { CANONICAL_COLOR_SLOTS } from "./colorSlots.js";
import { CANONICAL_TYPOGRAPHY_ROLES } from "./typographyRoles.js";
import { CANONICAL_SEMANTIC_SLOTS } from "./semanticSlots.js";
import { RAMPS, rampStepPaths } from "./ramps.js";

export * from "./colorSlots.js";
export * from "./typographyRoles.js";
export * from "./semanticSlots.js";
export * from "./ramps.js";

/**
 * Every canonical token path, in emission order, with the `$type` it must carry.
 *
 * A theme is never partially filled: creation seeds all of these from the default theme, and
 * publishing is blocked if any of them resolves to nothing.
 *
 * `kind` separates the two roles a canonical path can play. A **semantic** slot is what components,
 * generated code, the manifest and the editor's primary view bind to; it carries a description. A
 * **ramp-step** holds a value that semantic slots point at — it is emitted and validated, but never
 * bound to directly, never described, and excluded from the generation manifest. See the change
 * brief, C2 and C6.
 */
export type CanonicalSlotKind = "semantic" | "ramp-step";

export interface CanonicalSlot {
    path: TokenPath;
    type: TokenType;
    kind: CanonicalSlotKind;
}

const rampStepSlots = (): CanonicalSlot[] => {
    return RAMPS.flatMap(ramp =>
        rampStepPaths(ramp.id).map(path => ({
            path,
            type: ramp.type,
            kind: "ramp-step" as const
        }))
    );
};

export const CANONICAL_SLOTS: readonly CanonicalSlot[] = [
    ...CANONICAL_COLOR_SLOTS.map(slot => ({
        path: slot.path,
        type: "color" as const,
        kind: "semantic" as const
    })),
    ...CANONICAL_TYPOGRAPHY_ROLES.map(role => ({
        path: role.path,
        type: "typography" as const,
        kind: "semantic" as const
    })),
    ...CANONICAL_SEMANTIC_SLOTS.map(slot => ({
        path: slot.path,
        type: slot.type,
        kind: "semantic" as const
    })),
    ...rampStepSlots()
];

/** The bindable subset — everything a component, the manifest or the editor's main view sees. */
export const CANONICAL_SEMANTIC_PATHS: readonly TokenPath[] = CANONICAL_SLOTS.filter(
    slot => slot.kind === "semantic"
).map(slot => slot.path);

const CANONICAL_PATH_SET: ReadonlySet<TokenPath> = new Set(CANONICAL_SLOTS.map(slot => slot.path));

/**
 * True for core-owned slots. Canonical slots derive their variable name from their path and have
 * no immutable key — the path is the key, and it never changes.
 */
export const isCanonicalPath = (path: TokenPath): boolean => CANONICAL_PATH_SET.has(path);

export const getCanonicalSlot = (path: TokenPath): CanonicalSlot | undefined => {
    return CANONICAL_SLOTS.find(slot => slot.path === path);
};

/**
 * Usage-guidance description for every canonical *semantic* slot, keyed by path. This is the single
 * source the default theme seeds `$description` from and the generation manifest reads. Ramp steps
 * are absent by design — nothing binds to them, so they carry no guidance.
 */
export const CANONICAL_DESCRIPTIONS: ReadonlyMap<TokenPath, string> = new Map<TokenPath, string>([
    ...CANONICAL_COLOR_SLOTS.map(slot => [slot.path, slot.description] as const),
    ...CANONICAL_TYPOGRAPHY_ROLES.map(role => [role.path, role.description] as const),
    ...CANONICAL_SEMANTIC_SLOTS.map(slot => [slot.path, slot.description] as const)
]);

export const getCanonicalDescription = (path: TokenPath): string | undefined => {
    return CANONICAL_DESCRIPTIONS.get(path);
};

/**
 * Human-readable display name for every canonical semantic slot, keyed by path. Group-qualified so a
 * bare label ("Background") that repeats across groups stays unambiguous in the manifest and editor.
 */
export const CANONICAL_DISPLAY_NAMES: ReadonlyMap<TokenPath, string> = new Map<TokenPath, string>([
    ...CANONICAL_COLOR_SLOTS.map(slot => [slot.path, `${slot.groupLabel} ${slot.label}`] as const),
    ...CANONICAL_TYPOGRAPHY_ROLES.map(role => [role.path, role.label] as const),
    ...CANONICAL_SEMANTIC_SLOTS.map(
        slot => [slot.path, `${slot.groupLabel} ${slot.label}`] as const
    )
]);

export const getCanonicalDisplayName = (path: TokenPath): string | undefined => {
    return CANONICAL_DISPLAY_NAMES.get(path);
};
