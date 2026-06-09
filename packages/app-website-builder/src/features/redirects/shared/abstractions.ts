import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

export const RedirectsListCache = createAbstraction<IListCache<Redirect>>("RedirectsListCache");

export namespace RedirectsListCache {
    export type Interface = IListCache<Redirect>;
}
