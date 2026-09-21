import { BaseError } from "@webiny/feature/api";

export type PageCompositionErrorData = Record<string, unknown>;

/** Something the run does not contain, or contains in a shape page composition cannot use. */
export class PageCompositionError extends BaseError<PageCompositionErrorData> {
    override readonly code = "PageCompositionPoc/Error" as const;

    constructor(message: string, data: PageCompositionErrorData = {}) {
        super({ message, data });
    }
}
