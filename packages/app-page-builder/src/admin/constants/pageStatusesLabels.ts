import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-page-builder/admin/pages/statuses");

const statuses: Record<string, string> = {
    draft: t`Draft`,
    published: t`Published`,
    unpublished: t`Unpublished`
};
export default statuses;
