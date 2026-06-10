import React from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { RedirectListConfig } from "~/presentation/redirects/RedirectList/index.js";
import { useRedirect } from "~/presentation/redirects/RedirectList/index.js";
import { useMoveRedirectToFolder } from "~/presentation/redirects/RedirectList/index.js";

const { OptionsMenuItem } = RedirectListConfig.Browser.Redirect.Action;

export const Move = () => {
    const { redirect } = useRedirect();
    const openMoveDialog = useMoveRedirectToFolder(redirect);

    return <OptionsMenuItem icon={<MoveIcon />} label={"Move"} onAction={openMoveDialog} />;
};
