import type { CmsRefModelMetadata } from "./types.js";

export interface RefPointer {
    id: string;
    modelId: string;
    path: (string | number)[];
}

export function isRefObject(
    value: unknown,
    refModels: Record<string, CmsRefModelMetadata>
): value is { id: string; modelId: string } {
    if (value === null || value === undefined || typeof value !== "object") {
        return false;
    }
    const obj = value as Record<string, unknown>;
    if (typeof obj.id !== "string" || typeof obj.modelId !== "string") {
        return false;
    }
    return obj.modelId in refModels;
}

export function collectRefs(
    value: unknown,
    refModels: Record<string, CmsRefModelMetadata>,
    path?: (string | number)[],
    collected?: RefPointer[]
): RefPointer[] {
    const result = collected || [];
    collectRefsInner(value, refModels, path || [], result);
    return result;
}

function collectRefsInner(
    value: unknown,
    refModels: Record<string, CmsRefModelMetadata>,
    path: (string | number)[],
    collected: RefPointer[]
): void {
    if (value === null || value === undefined) {
        return;
    }

    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            collectRefsInner(value[i], refModels, [...path, i], collected);
        }
        return;
    }

    if (typeof value !== "object") {
        return;
    }

    if (isRefObject(value, refModels)) {
        collected.push({ id: value.id, modelId: value.modelId, path });
        return;
    }

    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
        if (key === "_templateId" || key === "__typename") {
            continue;
        }
        collectRefsInner(obj[key], refModels, [...path, key], collected);
    }
}

export function setAtPath(
    obj: Record<string, unknown>,
    path: (string | number)[],
    value: unknown
): void {
    let current: unknown = obj;
    for (let i = 0; i < path.length - 1; i++) {
        current = (current as Record<string | number, unknown>)[path[i]];
    }
    (current as Record<string | number, unknown>)[path[path.length - 1]] = value;
}
