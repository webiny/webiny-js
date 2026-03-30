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
    },
    infra: {
        id: "infra",
        label: "Infrastructure",
        description: "Infrastructure extensions."
    }
};

/**
 * Pattern-based "How to Use" items.
 * Keys support glob-like patterns: "api/*", "admin/*", "*".
 * Items are merged in order — more specific patterns first, then broader ones.
 * Each entry is a string that becomes a numbered step in the "How to Use" section.
 */
export const HOW_TO_USE: { pattern: string; items: string[] }[] = [
    {
        pattern: "api/*",
        items: [
            "Find the abstraction you need below",
            "You MUST read the source file to get the exact interface and types!",
            'Import: `import { Name } from "<importPath>";`',
            "See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns"
        ]
    },
    {
        pattern: "*",
        items: [
            "Find the abstraction you need below",
            "You MUST read the source file to get the exact interface and types!",
            'Import: `import { Name } from "<importPath>";`'
        ]
    }
];

/**
 * Match a category ID against a glob-like pattern.
 * Supports: "api/*" matches "api/cms", "api/security", etc.
 *           "admin/*" matches "admin/ui", "admin/cms", etc.
 *           "*" matches everything.
 *           Exact match: "api/cms" matches only "api/cms".
 */
function matchPattern(categoryId: string, pattern: string): boolean {
    if (pattern === "*") return true;
    if (pattern === categoryId) return true;
    const regexStr = pattern
        .replace(/\*\*/g, "\0GLOBSTAR\0")
        .replace(/\*/g, "[^/]*")
        .replace(/\0GLOBSTAR\0/g, ".*");
    return new RegExp("^" + regexStr + "$").test(categoryId);
}

/**
 * Get "How to Use" items for a category by matching against patterns.
 * Returns items from the first matching pattern.
 */
export function getHowToUse(categoryId: string): string[] {
    for (const rule of HOW_TO_USE) {
        if (matchPattern(categoryId, rule.pattern)) {
            return rule.items;
        }
    }
    return [];
}

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
