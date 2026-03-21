/**
 * Static configuration: category derivation from import paths.
 */
import type { CategoryInfo } from "./types.js";

export const CATEGORY_MAP: Record<string, CategoryInfo> = {
    "api/cms": {
        id: "api/cms",
        label: "API — Headless CMS",
        description: "Entry, model, and group event handlers and use cases."
    },
    "api/security": {
        id: "api/security",
        label: "API — Security & Auth",
        description: "Authentication, API keys, roles, users, teams event handlers and use cases."
    },
    "api/website-builder": {
        id: "api/website-builder",
        label: "API — Website Builder",
        description: "Page and redirect event handlers and use cases."
    },
    "api/tenancy": {
        id: "api/tenancy",
        label: "API — Tenancy",
        description: "Tenant lifecycle and installation event handlers and use cases."
    },
    "api/system": {
        id: "api/system",
        label: "API — System",
        description: "System installation event handlers and use cases."
    },
    "api/file-manager": {
        id: "api/file-manager",
        label: "API — File Manager",
        description: "File event handlers and use cases."
    },
    "api/aco": {
        id: "api/aco",
        label: "API — ACO",
        description: "Folder event handlers and use cases."
    },
    "api/scheduler": {
        id: "api/scheduler",
        label: "API — Scheduler",
        description: "Scheduled action use cases."
    },
    "api/tenant-manager": {
        id: "api/tenant-manager",
        label: "API — Tenant Manager",
        description: "Tenant management event handlers and use cases."
    }
};

/**
 * Derive category from a webiny import path.
 * Matches the longest prefix in CATEGORY_MAP.
 * E.g. "webiny/api/cms/entry" → "api/cms"
 */
export function deriveCategory(importPath: string): CategoryInfo {
    const stripped = importPath.replace(/^webiny\//, "");
    const segments = stripped.split("/");

    for (let len = segments.length; len > 0; len--) {
        const prefix = segments.slice(0, len).join("/");
        if (CATEGORY_MAP[prefix]) {
            return CATEGORY_MAP[prefix];
        }
    }

    const fallbackId = segments.slice(0, 2).join("/");
    return {
        id: fallbackId,
        label: fallbackId,
        description: ""
    };
}
