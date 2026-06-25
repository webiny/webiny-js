import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useRedirect } from "../../../hooks/useRedirect.js";
import { useDeleteRedirect } from "../../../hooks/useDeleteRedirect.js";
import { RedirectListConfig } from "../../../configs/RedirectListConfig.js";

export const Delete = () => {
    const { redirect } = useRedirect();
    const { openDeleteDialog } = useDeleteRedirect({ redirect });

    const { OptionsMenuItem } = RedirectListConfig.Browser.Redirect.Action;

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Delete"}
            onAction={openDeleteDialog}
            className={"text-destructive-primary! [&_svg]:fill-destructive"}
        />
    );
};
