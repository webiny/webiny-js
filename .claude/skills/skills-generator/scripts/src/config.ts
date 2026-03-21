/**
 * Static configuration maps for the skill generation pipeline.
 * Category derivation, description templates, notes, and operation mappings.
 */

export interface CategoryInfo {
    id: string;
    label: string;
    description: string;
}

/**
 * Category derivation from import paths — prefixed with layer.
 * Keys are path segments after "webiny/", matched by longest prefix.
 */
export const CATEGORY_MAP: Record<string, CategoryInfo> = {
    // API layer (Node.js backend)
    "api/cms": {
        id: "api/cms",
        label: "API — Headless CMS",
        description: "Entry, model, and group lifecycle hooks and use cases.",
    },
    "api/security": {
        id: "api/security",
        label: "API — Security & Auth",
        description: "Authentication, API keys, roles, users, and teams.",
    },
    "api/website-builder": {
        id: "api/website-builder",
        label: "API — Website Builder",
        description: "Page and redirect lifecycle hooks.",
    },
    "api/tenancy": {
        id: "api/tenancy",
        label: "API — Tenancy",
        description: "Tenant lifecycle and installation hooks.",
    },
    "api/system": {
        id: "api/system",
        label: "API — System",
        description: "System installation hooks.",
    },
    "api/file-manager": {
        id: "api/file-manager",
        label: "API — File Manager",
        description: "File lifecycle hooks and use cases.",
    },
    "api/aco": {
        id: "api/aco",
        label: "API — ACO",
        description: "Folder lifecycle hooks.",
    },
    "api/scheduler": {
        id: "api/scheduler",
        label: "API — Scheduler",
        description: "Scheduled action use cases.",
    },
    "api/tenant-manager": {
        id: "api/tenant-manager",
        label: "API — Tenant Manager",
        description: "Tenant management use cases.",
    },
    // Admin layer (React app) — future
    "admin/cms": {
        id: "admin/cms",
        label: "Admin — Headless CMS",
        description: "CMS editor, field renderers, and model configuration.",
    },
    "admin/security": {
        id: "admin/security",
        label: "Admin — Security",
        description: "Login, permissions UI, and user management.",
    },
    "admin/website-builder": {
        id: "admin/website-builder",
        label: "Admin — Website Builder",
        description: "Page editor, routes, and integrations.",
    },
    // Infra layer — future
    "infra/api": {
        id: "infra/api",
        label: "Infra — API",
        description: "API build, deploy, and watch hooks.",
    },
    "infra/admin": {
        id: "infra/admin",
        label: "Infra — Admin",
        description: "Admin build, deploy, and watch hooks.",
    },
    "infra/core": {
        id: "infra/core",
        label: "Infra — Core",
        description: "Core infrastructure hooks.",
    },
};

/**
 * Derive category from a webiny import path.
 * Matches the longest prefix in CATEGORY_MAP.
 * E.g. "webiny/api/cms/entry" → "api/cms"
 */
export function deriveCategory(importPath: string): CategoryInfo {
    // Strip "webiny/" prefix
    const path = importPath.replace(/^webiny\//, "");

    // Try progressively shorter prefixes
    const segments = path.split("/");
    for (let len = segments.length; len > 0; len--) {
        const prefix = segments.slice(0, len).join("/");
        if (CATEGORY_MAP[prefix]) {
            return CATEGORY_MAP[prefix];
        }
    }

    // Fallback: use first two segments as category
    const fallbackId = segments.slice(0, 2).join("/");
    return {
        id: fallbackId,
        label: fallbackId,
        description: `Skills for ${fallbackId}.`,
    };
}

/** Operation verb → past tense for description generation */
export const OPERATION_PAST_TENSE: Record<string, string> = {
    create: "created",
    update: "updated",
    delete: "deleted",
    publish: "published",
    unpublish: "unpublished",
    republish: "republished",
    move: "moved",
    restore: "restored",
    install: "installed",
    duplicate: "duplicated",
    authenticate: "authenticated",
    "restore-from-bin": "restored from bin",
    "delete-multiple": "deleted (batch)",
    "create-revision-from": "created (revision from existing)",
};

/** Notes by abstraction type and timing */
export const NOTES_CONFIG: Record<string, Record<string, string[]>> = {
    EventHandler: {
        before: [
            "Handler fires for ALL models/entities — always filter by relevant ID",
            "`event.payload` may be mutable — write to it to set computed fields",
            "Throw an error to reject the operation",
        ],
        after: [
            "Handler fires for ALL models/entities — always filter by relevant ID",
            "`event.payload` reflects the persisted state — do not mutate",
            "Use for side effects: notifications, sync, cache invalidation",
        ],
        none: [
            "This is a lifecycle event without before/after timing",
            "Use for reacting to system-level events",
        ],
    },
    UseCase: {
        default: [
            "Use cases can be overridden via DI to customize behavior",
            "Use `Result` return type for error handling — check `.isOk()` / `.isErr()`",
        ],
    },
};

/** Entity-specific notes that override or supplement the defaults */
export const ENTITY_NOTES: Record<string, string[]> = {
    Entry: ["Handler fires for ALL content models — always filter by `event.payload.model.modelId`"],
    Model: ["Model handlers affect all content models — use with caution"],
    Page: ["Page handlers affect all pages across all locales"],
};

/** Registration snippet templates by layer */
export const REGISTRATION_SNIPPETS: Record<string, string> = {
    api: '<Api.Extension src={"@/extensions/${fileName}.ts"} />',
    admin: '<Admin.Extension src={"@/extensions/${fileName}.ts"} />',
    infra: "// Register in your infrastructure configuration",
};

/**
 * Get notes for a given abstraction type + timing + entity.
 */
export function getNotes(
    abstractionType: string,
    timing: string | undefined,
    entity: string
): string[] {
    const typeNotes = NOTES_CONFIG[abstractionType];
    if (!typeNotes) return [];

    const timingKey = timing ?? "none";
    const baseNotes = typeNotes[timingKey] ?? typeNotes["default"] ?? [];
    const entityNotes = ENTITY_NOTES[entity] ?? [];

    // Entity notes replace the first base note if it's about filtering
    if (entityNotes.length > 0) {
        const filtered = baseNotes.filter(n => !n.includes("fires for ALL"));
        return [...entityNotes, ...filtered];
    }

    return baseNotes;
}

/**
 * Build a "fires when" description for EventHandlers.
 */
export function buildFiresWhen(
    timing: string | undefined,
    operation: string,
    entity: string
): string {
    const pastTense = OPERATION_PAST_TENSE[operation] ?? operation + "d";
    if (timing === "before") {
        return `Before ${entity.toLowerCase()} is ${pastTense}`;
    }
    if (timing === "after") {
        return `After ${entity.toLowerCase()} is ${pastTense}`;
    }
    return `When ${entity.toLowerCase()} is ${pastTense}`;
}

/**
 * Build a description for an EventHandler skill.
 */
export function buildEventHandlerDescription(
    timing: string | undefined,
    operation: string,
    entity: string
): string {
    const pastTense = OPERATION_PAST_TENSE[operation] ?? operation + "d";
    if (timing === "before") {
        return `Intercept ${entity.toLowerCase()} ${operation} before it is persisted. Validate, transform, or reject.`;
    }
    if (timing === "after") {
        return `React after ${entity.toLowerCase()} is ${pastTense}. Side effects, notifications, external sync.`;
    }
    return `React when ${entity.toLowerCase()} is ${pastTense}.`;
}

/**
 * Build a description for a UseCase skill.
 */
export function buildUseCaseDescription(operation: string, entity: string): string {
    return `Programmatically ${operation} ${entity.toLowerCase()}.`;
}
