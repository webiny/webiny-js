import React from "react";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { RedirectListConfig } from "~/modules/redirects/configs/index.js";
import { useEditRedirectDialog } from "~/modules/redirects/RedirectsList/hooks/useEditRedirectDialog.js";
import { useRedirect } from "~/modules/redirects/RedirectsList/hooks/useRedirect.js";

const { OptionsMenuItem } = RedirectListConfig.Browser.Redirect.Action;

export const Edit = () => {
    const { redirect } = useRedirect();
    const { showEditRedirectDialog } = useEditRedirectDialog();

    return (
        <OptionsMenuItem
            icon={<EditIcon />}
            label={"Edit"}
            onAction={() => showEditRedirectDialog(redirect.id)}
        />
    );
};
