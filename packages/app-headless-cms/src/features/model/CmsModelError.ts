import type { CmsErrorResponse } from "~/types.js";

/**
 * An error returned by the CMS API for a content model request. Keeps the error `code` and
 * `data` (e.g. the `invalidFields` of a `Cms/Model/ValidationError`) so the form can show
 * what was rejected.
 */
export class CmsModelError extends Error {
    public readonly code: string | undefined;
    public readonly data: CmsErrorResponse["data"];

    public constructor(error: CmsErrorResponse | null | undefined, fallbackMessage: string) {
        super(error?.message || fallbackMessage);
        this.name = "CmsModelError";
        this.code = error?.code;
        this.data = error?.data;
    }
}
