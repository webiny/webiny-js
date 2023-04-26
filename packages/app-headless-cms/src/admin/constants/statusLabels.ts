import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/content-entries/status");

export interface StatusLabels {
    draft: string;
    published: string;
    unpublished: string;
}

export const statusLabels: StatusLabels = {
    draft: t`Draft`,
    published: t`Published`,
    unpublished: t`Unpublished`
};
