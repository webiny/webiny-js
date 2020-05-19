import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const SubmitButton = ({ state }) => {
    return <ButtonPrimary onClick={() => state.contentForm.submit()}>{t`Save`}</ButtonPrimary>;
};

export default SubmitButton;
