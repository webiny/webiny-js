import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ButtonSecondary } from "@webiny/ui/Button";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const SaveContentButton = ({ state }) => {
    return <ButtonSecondary onClick={() => state.contentForm.submit()}>{t`Save`}</ButtonSecondary>;
};

export default SaveContentButton;
