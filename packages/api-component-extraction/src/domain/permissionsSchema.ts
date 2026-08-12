import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

/**
 * One permission gates the whole Component Extraction app — the Theme app's single-permission pattern.
 *
 * `rwd` covers create, edit and delete of jobs, runs and the extraction work. There is no publish/
 * unpublish act here (promotion into the component Library is gated on both this permission and the
 * components module's own), and no `own` scope — extraction is tenant-level tooling, not per-author
 * content.
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
