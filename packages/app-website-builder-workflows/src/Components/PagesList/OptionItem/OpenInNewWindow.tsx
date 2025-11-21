import React, { useCallback } from "react";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { Components } from "@webiny/app-workflows";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { useRouter } from "@webiny/app";
import { Routes } from "@webiny/app-website-builder/routes.js";
import { WB_PAGE_APP } from "~/constants.js";

const { OpenInNewWindow } = Components.List.Options;

export const ListOpenInNewWindow = OpenInNewWindow.createDecorator(Original => {
    return function ListOpenInNewWindow(props) {
        const { state } = props;

        const { getLink } = useRouter();
        const onClick = useCallback(() => {
            const url = getLink(Routes.Pages.Editor, {
                id: state.targetRevisionId,
                folderId: "root"
            });

            const goTo = `${window.location.origin}${url}`;

            window.open(goTo, "_blank");
        }, [state.id]);

        if (state.app !== WB_PAGE_APP) {
            return <Original {...props} />;
        }

        return (
            <DropdownMenu.Item
                icon={<Icon icon={<OpenInNewIcon />} label={"Open In New Window"} />}
                text={"Open in New Window"}
                onClick={onClick}
            />
        );
    };
});
