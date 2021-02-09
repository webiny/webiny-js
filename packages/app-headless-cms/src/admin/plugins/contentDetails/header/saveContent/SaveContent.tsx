import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ButtonSecondary } from "@webiny/ui/Button";
import usePermission from "../../../../hooks/usePermission";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const SaveContentButton = ({ state, entry }) => {
    const { canEdit } = usePermission();

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonSecondary
            data-testid={"cms-content-save-content-button"}
            onClick={() => state.contentForm.submit()}
        >{t`Save`}</ButtonSecondary>
    );
};

export default SaveContentButton;
