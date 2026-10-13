import { createAbstraction } from "@webiny/feature/api";
import type { WbPageTarget } from "../WbPageTargetReader/abstractions.js";

export interface IWbPageAccess {
    /**
     * Entity-level write permission (any page), as WB checks it before loading a page; lets the
     * request wrapper refuse before it reads anything (R75).
     */
    canWriteAnyPage(): Promise<boolean>;
    /**
     * Entity-level delete permission (any page; an own-only permission passes), checked before
     * anything is read so the cancel-for-delete wrapper reveals nothing (R86).
     */
    canDeleteAnyPage(): Promise<boolean>;
    /** Read access of the current identity (review actions, get review). */
    canRead(target: WbPageTarget): Promise<boolean>;

    /**
     * Read access of the current identity to pages in a folder, without a page (the routing
     * inspector, R121): `wb.page` read plus folder content read. Root (`null` or `"root"`) or FLP
     * not in use: the page read only. No own-only check without a page (A47).
     */
    canReadInFolder(folderId: string | null): Promise<boolean>;
    /** Write access of the current identity (request a review, D77); includes read (R82). */
    canWrite(target: WbPageTarget): Promise<boolean>;
    /** Delete access of the current identity (trash, delete, cancel-for-delete, D134). */
    canDelete(target: WbPageTarget): Promise<boolean>;
}

/**
 * Website Builder's own page access for the current identity (R47, A25): `wb.page` permissions
 * (incl. own-only) as `GetPageByIdUseCase`, `UpdatePageUseCase` and `TrashPageUseCase` check them,
 * plus folder-level permissions on the page's folder.
 */
export const WbPageAccess = createAbstraction<IWbPageAccess>("WbPageAccess");

export namespace WbPageAccess {
    export type Interface = IWbPageAccess;
}
