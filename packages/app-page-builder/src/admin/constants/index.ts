import { i18n } from "@webiny/app/i18n";
import { PbPageDataStatus } from "~/types";
const t = i18n.ns("app-page-builder/admin/pages/statuses");

export const PB_APP_TYPE = "PbPage";
export const FOLDER_ID_DEFAULT = "ROOT";
export const statuses: Record<PbPageDataStatus, string> = {
    draft: t`Draft`,
    published: t`Published`,
    unpublished: t`Unpublished`
};

export const PAGE_BUILDER_EDITOR_LINK = "/page-builder/editor";
export const PAGE_BUILDER_LIST_LINK = "/page-builder/pages";
export const LOCAL_STORAGE_LATEST_VISITED_FOLDER = "webiny_pb_page_latest_visited_folder";
