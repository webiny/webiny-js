import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/content-entries/status");

export default {
    draft: t`Draft`,
    published: t`Published`,
    unpublished: t`Unpublished`,
    changesRequested: t`Changes Requested`,
    reviewRequested: t`Review Requested`
};
