import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/content-entries/status");

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
