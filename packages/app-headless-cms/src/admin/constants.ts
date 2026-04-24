export { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
export const createLastVisitedFolderKey = (modelId: string) =>
    `cms/entry/${modelId}/list/last-folder`;

export type Statuses = typeof statuses;

export const statuses = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished"
};
