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
