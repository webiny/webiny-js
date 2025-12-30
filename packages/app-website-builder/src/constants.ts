export const BASE_BREAKPOINT = "desktop";
export { ROOT_FOLDER } from "@webiny/app-aco/constants.js";

export type WbStatus = (typeof WbPageStatus)[keyof typeof WbPageStatus];

export const WbPageStatus = {
    Draft: "draft",
    Published: "published",
    Unpublished: "unpublished"
} as const;

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
export const WB_REDIRECTS_APP = "wb:redirect";
export const WB_PAGE_LATEST_VISITED_FOLDER = "WBY_wb_page_latest_visited_folder";
export const WB_REDIRECT_LATEST_VISITED_FOLDER = "WBY_wb_redirect_latest_visited_folder";
