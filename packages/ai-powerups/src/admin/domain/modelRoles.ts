/**
 * The model role ids, admin-side.
 *
 * A closed set by design: an extension can add a capability, never a role. That is why this is a
 * record keyed by id everywhere it appears rather than a list — three named slots, not a collection
 * someone appends to.
 *
 * The api owns the ids and the resolution rules (`~/api/features/ModelRoles/roles.ts`). They are
 * repeated here rather than imported because admin and api are separate bundles and nothing else in
 * `src/admin` reaches across that line; settings section names are already duplicated the same way.
 *
 * This lives in `domain` rather than next to the settings form so `features/` can use it without
 * importing from `presentation/`. The labels and descriptions stay in
 * `~/admin/presentation/modelRoles.js`, since those are words on a screen.
 */
export const AI_MODEL_ROLE_IDS = ["fast", "standard", "vision"] as const;

export type AiModelRoleId = (typeof AI_MODEL_ROLE_IDS)[number];
