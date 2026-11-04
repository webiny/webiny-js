import type { ReviewCacheRef } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { PageListCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import type { WbPageSystem } from "@webiny/app-website-builder/types.js";
import { WB_PAGE_APP } from "~/constants.js";
import "~/types.js";
import { WbReviewPageCacheWriter as Abstraction } from "./abstractions.js";

class WbReviewPageCacheWriterImpl implements Abstraction.Interface {
    constructor(
        private pageListCache: PageListCache.Interface,
        private fullPageCache: FullPageCache.Interface
    ) {}

    canHandle(namespace: string): boolean {
        return namespace === WB_PAGE_APP;
    }

    write(ref: ReviewCacheRef, workflow: SystemWorkflowValue | null): void {
        /*
         * Only the revision the review belongs to is updated: a review of an older revision must
         * not mark the latest revision held by the list cache.
         */
        const updatePage = (page: Page): Page => {
            if (page.id !== ref.targetRevisionId) {
                return page;
            }

            const system: WbPageSystem = { ...page.system, workflow };
            return Page.create({ ...page, system });
        };

        this.pageListCache.updateItems(updatePage);
        this.fullPageCache.updateItems(updatePage);
    }
}

export const WbReviewPageCacheWriter = Abstraction.createImplementation({
    implementation: WbReviewPageCacheWriterImpl,
    dependencies: [PageListCache, FullPageCache]
});
