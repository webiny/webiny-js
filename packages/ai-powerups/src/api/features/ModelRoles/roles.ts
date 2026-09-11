/**
 * Model roles are the indirection between an AI feature and a concrete model.
 *
 * A feature never names a model. It names a role, and the project decides which model fills that
 * role. That keeps the settings screen small (one select per role, not one per feature) while still
 * letting a project run cheap work on a cheap model.
 *
 * The set is deliberately fixed and closed. A project that needs a different model for one specific
 * feature overrides that feature under Capabilities instead of inventing a role.
 *
 * Labels and descriptions are not here on purpose: they are UI text, and they live next to the
 * settings form in `~/admin/presentation/modelRoles.js`.
 */
export const AI_MODEL_ROLE_IDS = ["fast", "standard", "vision"] as const;

export type AiModelRoleId = (typeof AI_MODEL_ROLE_IDS)[number];

export const isAiModelRoleId = (value: unknown): value is AiModelRoleId =>
    typeof value === "string" && (AI_MODEL_ROLE_IDS as readonly string[]).includes(value);
