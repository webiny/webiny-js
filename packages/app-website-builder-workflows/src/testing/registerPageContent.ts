import { vi } from "vitest";
import type { Mock } from "vitest";
import type { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { GetPageUseCase } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import type { GetPageParams } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { WbPermissions } from "@webiny/app-website-builder/features/permissions/abstractions.js";

export interface PageContentOwnableItem {
    createdBy: { id: string };
}

export interface PageContentHandles {
    cache: ListCache<Page>;
    getPage: { execute: Mock<(params: GetPageParams) => Promise<Page>> };
    permissions: { canEdit: Mock<(entity: string, item?: PageContentOwnableItem) => boolean> };
}

// What `PageReviewBar` needs from `app-website-builder`: the full page cache, the get use case and
// the page permissions (a user who can edit pages unless a test says otherwise).
export const registerPageContent = (container: Container): PageContentHandles => {
    const cache = new ListCache<Page>("id");
    const getPage = {
        execute: vi.fn(async (params: GetPageParams) => {
            return Page.create({ id: params.id });
        })
    };

    const permissions = {
        canEdit: vi.fn((_entity: string, _item?: PageContentOwnableItem) => true)
    };

    container.registerInstance(FullPageCache, cache);
    container.registerInstance(GetPageUseCase, getPage);
    container.registerInstance(WbPermissions, permissions as unknown as WbPermissions.Interface);

    return { cache, getPage, permissions };
};
