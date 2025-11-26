import React from "react";
import { Widget } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

export const PagesWidget = () => {
    const { goToRoute } = useRouter();

    return (
        <Widget
            variant="accent"
            title="Website Builder"
            icon={<Widget.Icon icon={<HistoryIcon />} label={"Website Builder"} />}
            padding="md"
            footerStartActions={
                <Widget.Action icon={<AddIcon />} onClick={() => goToRoute(Routes.Pages.List)}>
                    New Page
                </Widget.Action>
            }
        >
            Build stunning landing pages with an easy to use drag and drop editor.
        </Widget>
    );
};
