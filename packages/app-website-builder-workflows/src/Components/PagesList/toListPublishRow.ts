import type { ListPublishRow } from "@webiny/app-workflows/review/presentation/listActions/ListPublishRow.js";
import type { WbPageSystem } from "@webiny/app-website-builder/types.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import "~/types.js";

// A pages list row: the list's `Page` and the row action's `PageDto` both have these.
export interface PublishRowPage {
    status: string;
    system: WbPageSystem | null;
}

// What the shared publish gates need to know about a pages list row. Pure.
export const toListPublishRow = (page: PublishRowPage): ListPublishRow => {
    return {
        reviewState: page.system?.workflow?.reviewState ?? null,
        isPublished: page.status === WbPageStatus.Published,
        isUnpublished: page.status === WbPageStatus.Unpublished
    };
};
