import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ButtonSecondary } from "@webiny/ui/Button";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import usePermission from "~/admin/hooks/usePermission";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const SaveContentButton = () => {
    const { form, entry } = useContentEntry();
    const { canEdit } = usePermission();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onClick={() => form.current.submit()}
        >{t`Save`}</ButtonSecondary>
    );
};

export default SaveContentButton;
