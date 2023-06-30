import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import usePermission from "~/admin/hooks/usePermission";
import { useButtons } from "@webiny/app-admin";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

export const SaveContentButton: React.FC = () => {
    const { form, entry } = useContentEntry();
    const { canEdit } = usePermission();
    const { ButtonSecondary } = useButtons();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onAction={ev => {
                form.current.submit(ev);
            }}
        >{t`Save`}</ButtonSecondary>
    );
};
