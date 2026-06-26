import React from "react";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { useEditPageUrl } from "~/presentation/pages/PageList/hooks/useEditPageUrl.js";
import { usePage } from "~/presentation/pages/PageList/hooks/usePage.js";
import { PageListConfig } from "~/presentation/pages/PageList/configs/index.js";

const { OptionsMenuLink } = PageListConfig.Browser.Page.Action;

export const Edit = () => {
    const { page } = usePage();
    const { getEditPageUrl } = useEditPageUrl();

    return <OptionsMenuLink icon={<EditIcon />} label={"Edit"} to={getEditPageUrl(page.id)} />;
};
