import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/content-entries/status");

export { ROOT_FOLDER } from "@webiny/app-aco/constants";
export const CMS_ENTRY_LIST_LINK = "/cms/content-entries";
export const LOCAL_STORAGE_LATEST_VISITED_FOLDER = "webiny_cms_entry_latest_visited_folder";

export interface Statuses {
    draft: `Draft`;
    published: `Published`;
    unpublished: `Unpublished`;
}

export const statuses: Statuses = {
    draft: t`Draft`,
    published: t`Published`,
    unpublished: t`Unpublished`
};
