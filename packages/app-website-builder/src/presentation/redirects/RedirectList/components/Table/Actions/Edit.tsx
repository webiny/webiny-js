import React from "react";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { RedirectListConfig } from "../../../configs/RedirectListConfig.js";
import { useRedirect } from "../../../hooks/useRedirect.js";
import { useRedirectListPresenter } from "../../RedirectListPresenterProvider.js";

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
