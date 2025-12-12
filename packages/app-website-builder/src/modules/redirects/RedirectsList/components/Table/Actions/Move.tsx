import React from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { useMoveRedirectToFolderDialog } from "~/modules/redirects/RedirectsList/hooks/useMoveRedirectToFolderDialog.js";
import { useRedirect } from "~/modules/redirects/RedirectsList/hooks/useRedirect.js";
import { RedirectListConfig } from "~/modules/redirects/configs/index.js";

const { OptionsMenuItem } = RedirectListConfig.Browser.Redirect.Action;

export const Move = () => {
    const { redirect } = useRedirect();

    const { openMoveRedirectToFolderDialog } = useMoveRedirectToFolderDialog({ redirect });

    return (
        <OptionsMenuItem
            icon={<MoveIcon />}
            label={"Move"}
            onAction={openMoveRedirectToFolderDialog}
        />
    );
};
