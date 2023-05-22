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
