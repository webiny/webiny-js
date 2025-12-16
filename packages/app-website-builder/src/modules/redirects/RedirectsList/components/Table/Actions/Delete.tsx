import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useRedirect } from "~/modules/redirects/RedirectsList/hooks/useRedirect.js";
import { useDeleteRedirectConfirmationDialog } from "~/modules/redirects/RedirectsList/hooks/useDeleteRedirectConfirmationDialog.js";
import { RedirectListConfig } from "~/modules/redirects/configs/index.js";

export const Delete = () => {
    const { redirect } = useRedirect();
    const { openDeleteRedirectConfirmationDialog } = useDeleteRedirectConfirmationDialog({
        redirect
    });

    const { OptionsMenuItem } = RedirectListConfig.Browser.Redirect.Action;

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Delete"}
            onAction={openDeleteRedirectConfirmationDialog}
            className={"text-destructive-primary! [&_svg]:fill-destructive"}
        />
    );
};
