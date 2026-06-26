import type { Page } from "./Page.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";

export const fullPageCache = new ListCache<Page>("id");
export const pageListCache = new ListCache<Page>("entryId");
