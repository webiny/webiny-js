/**
 * The model roles, as the settings screen presents them.
 *
 * The api owns the ids and the resolution rules (`~/api/features/ModelRoles/roles.ts`); this owns
 * the words. The ids are repeated rather than imported because admin and api are separate bundles
 * and nothing else in `src/admin` reaches across that line. Settings section names are already
 * duplicated the same way.
 *
 * The set is closed by design, so a constant is safe: an extension can add a capability, never a
 * role.
 */
export const AI_MODEL_ROLE_IDS = ["fast", "standard", "vision"] as const;

export type AiModelRoleId = (typeof AI_MODEL_ROLE_IDS)[number];

/** Typed as a full record, so adding a role id without a label is a compile error. */
const ROLE_TEXT: Record<AiModelRoleId, { label: string; description: string }> = {
    fast: {
        label: "Fast",
        description:
            "Cheap, low-latency work where a smaller model is good enough: summarising, classifying, comparing."
    },
    standard: {
        label: "Standard",
        description:
            "The workhorse. Anything that writes content a person will read, or has to follow a schema and call tools. Every other role falls back to this one when left empty."
    },
    vision: {
        label: "Vision",
        description:
            "Work that reads images. Pick a model that accepts image input. Left empty, image features fall back to Standard and only work there if Standard is multimodal too."
    }
};

export const AI_MODEL_ROLE_DISPLAY = AI_MODEL_ROLE_IDS.map(id => ({ id, ...ROLE_TEXT[id] }));

export const roleLabel = (id: string): string =>
    id in ROLE_TEXT ? ROLE_TEXT[id as AiModelRoleId].label : id;
