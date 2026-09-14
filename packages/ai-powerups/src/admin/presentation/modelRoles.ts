import { AI_MODEL_ROLE_IDS } from "~/admin/domain/modelRoles.js";
import type { AiModelRoleId } from "~/admin/domain/modelRoles.js";

/**
 * The model roles, as the settings screen presents them. The ids live in
 * `~/admin/domain/modelRoles.js`; this owns the words.
 *
 * Typed as a full record, so adding a role id without a label is a compile error.
 */
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

export { AI_MODEL_ROLE_IDS };
export type { AiModelRoleId };

export const AI_MODEL_ROLE_DISPLAY = AI_MODEL_ROLE_IDS.map(id => ({ id, ...ROLE_TEXT[id] }));

export const roleLabel = (id: string): string =>
    id in ROLE_TEXT ? ROLE_TEXT[id as AiModelRoleId].label : id;
