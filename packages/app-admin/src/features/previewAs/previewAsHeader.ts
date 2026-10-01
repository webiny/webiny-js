import type { PreviewContext } from "./abstractions.js";

/*
 * Kept in step by hand with PREVIEW_AS_HEADER in @webiny/api-core, the same way `x-tenant` is:
 * the Admin cannot import a backend package.
 */
export const PREVIEW_AS_HEADER = "x-webiny-preview-as";

export function previewAsHeaderValue(value: PreviewContext.Value): string {
    return `${value.type}:${value.id}`;
}
