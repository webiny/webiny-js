import type { CmsErrorResponse } from "~/types.js";

/**
 * An error returned by the CMS API. Keeps the error `code` and `data` (e.g. the per-field
 * list of a `Cms/Entry/ValidationError`) so the form can show what was rejected.
 */
export class CmsEntryError extends Error {
    public readonly code: string | undefined;
    public readonly data: CmsErrorResponse["data"];

    public constructor(error: CmsErrorResponse | null | undefined, fallbackMessage: string) {
        super(error?.message || fallbackMessage);
        this.name = "CmsEntryError";
        this.code = error?.code;
        this.data = error?.data;
    }
}
