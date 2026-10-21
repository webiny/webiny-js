import { vi } from "vitest";
import type { Mock } from "vitest";
import type { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { GetPageUseCase } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import type { GetPageParams } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";

export interface PageContentHandles {
    cache: ListCache<Page>;
    getPage: { execute: Mock<(params: GetPageParams) => Promise<Page>> };
}

// What `PageReviewBar` needs from `app-website-builder`: the full page cache and the get use case.
export const registerPageContent = (container: Container): PageContentHandles => {
    const cache = new ListCache<Page>("id");
    const getPage = {
        execute: vi.fn(async (params: GetPageParams) => {
            return Page.create({ id: params.id });
        })
    };

    container.registerInstance(FullPageCache, cache);
    container.registerInstance(GetPageUseCase, getPage);

    return { cache, getPage };
};
