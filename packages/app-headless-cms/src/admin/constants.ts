export { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
export const LOCAL_STORAGE_LATEST_VISITED_FOLDER = "WBY_cms_entry_latest_visited_folder";

export type Statuses = typeof statuses;

export const statuses = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished"
};
