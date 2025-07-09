export const BASE_BREAKPOINT = "desktop";
export { ROOT_FOLDER } from "@webiny/app-aco/constants";

export type WbStatus = (typeof statuses)[keyof typeof statuses];
export const statuses = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished"
} as const;

export type WbLoading = (typeof loadingActions)[keyof typeof loadingActions];
export const loadingActions = {
    create: "CREATE",
    createRevisionFrom: "CREATE_REVISION_FROM",
    delete: "DELETE",
    duplicate: "DUPLICATE",
    get: "GET",
    init: "INIT",
    list: "LIST",
    listMore: "LIST_MORE",
    move: "MOVE",
    publish: "PUBLISH",
    unpublish: "UNPUBLISH",
    update: "UPDATE"
} as const;

export const WB_PAGE_APP = "wb:page";
export const LOCAL_STORAGE_KEY_LATEST_VISITED_FOLDER = "webiny_wb_page_latest_visited_folder";
export const PAGE_LIST_ROUTE = "/website-builder/pages";
export const PAGE_EDITOR_ROUTE = "/website-builder/pages/editor";
