import React from "react";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { RedirectListConfig } from "~/modules/redirects/configs/index.js";
import { useRedirect } from "~/modules/redirects/RedirectsList/hooks/useRedirect.js";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";

const { OptionsMenuItem } = RedirectListConfig.Browser.Redirect.Action;

export const Edit = () => {
    const { redirect } = useRedirect();
    const { actions } = useRedirectListPresenter();

    return (
        <OptionsMenuItem
            icon={<EditIcon />}
            label={"Edit"}
            onAction={() => actions.showEditDialog(redirect.id)}
        />
    );
};
