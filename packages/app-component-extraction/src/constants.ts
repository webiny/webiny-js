import { createPermissionSchema } from "@webiny/app-admin";

/**
 * Mirrors `COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA` in `@webiny/api-component-extraction`. The two are
 * declared separately because each side builds from its own factory, but the prefix, entity id and
 * action names MUST stay identical — the permissions the Admin UI emits are evaluated by the API schema.
 */
export const COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "componentExtraction",
    fullAccess: true,
    entities: [
        {
            id: "componentExtraction",
            permission: "componentExtraction.componentExtraction",
            scopes: ["full"],
            actions: [{ name: "rwd" }]
        }
    ]
});

/** The nine pipeline stages, in order. Load-bearing: the gate advances a run one stage at a time. */
export const STAGES = [
    "discover",
    "capture",
    "segment",
    "cluster",
    "classify",
    "plan",
    "generate",
    "assemble",
    "promote"
] as const;

export type Stage = (typeof STAGES)[number];

/** Human labels for each stage, for the run view. */
export const STAGE_LABELS: Record<Stage, string> = {
    discover: "Discover",
    capture: "Capture",
    segment: "Segment",
    cluster: "Cluster",
    classify: "Classify",
    plan: "Plan",
    generate: "Generate",
    assemble: "Assemble",
    promote: "Promote"
};

export const DEFAULT_PAGE_CAP = 40;
export const MAX_PAGE_CAP = 150;

// Websocket actions the stage runner emits (mirrors `~/domain/stage.js` on the API side). The run view
// refetches when one arrives; the poll is the fallback when a message is dropped.
export const STAGE_PROGRESS_ACTION = "componentExtraction.stage.progress";
export const STAGE_DONE_ACTION = "componentExtraction.stage.done";
export const STAGE_FAILED_ACTION = "componentExtraction.stage.failed";
