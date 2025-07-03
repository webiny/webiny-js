export { ROOT_FOLDER } from "@webiny/app-aco/constants";

export type WbStatus = (typeof statuses)[keyof typeof statuses];
export const statuses = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished"
} as const;

export type WbLoading = (typeof loadingActions)[keyof typeof loadingActions];
export const loadingActions = {
    init: "INIT",
    list: "LIST",
    listMore: "LIST_MORE",
    get: "GET",
    create: "CREATE",
    update: "UPDATE",
    delete: "DELETE",
    move: "MOVE",
    publish: "PUBLISH"
} as const;
