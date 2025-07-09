import React from "react";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { useGetEditPageUrl } from "~/DocumentList/hooks/useGetEditPageUrl.js";
import { useDocument } from "~/DocumentList/hooks/useDocument.js";
import { PageListConfig } from "~/configs/index.js";

export const Edit = () => {
    const { document } = useDocument();
    const { getEditPageUrl } = useGetEditPageUrl();
    const { OptionsMenuLink } = PageListConfig.Browser.PageAction;

    return <OptionsMenuLink icon={<EditIcon />} label={"Edit"} to={getEditPageUrl(document)} />;
};
