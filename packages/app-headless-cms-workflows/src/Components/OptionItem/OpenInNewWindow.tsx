import React, { useCallback } from "react";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { Components } from "@webiny/app-workflows";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { useRouter } from "@webiny/app";
import { Routes } from "@webiny/app-headless-cms/routes.js";
import { parseAppName } from "~/utils/appName.js";
import { useLazyQuery } from "@webiny/app-headless-cms";
import type { IListCmsRevisionsResponse } from "~/Components/OptionItem/graphql/contentEntries.js";

const { OpenInNewWindow } = Components.List.Options;


export const ListOpenInNewWindow = OpenInNewWindow.createDecorator(() => {
    return function ListOpenInNewWindow(props) {
        const { state } = props;
        
        const x = useLazyQuery<IListCmsRevisionsResponse, IListCmsRevisionsVariables>()
        
        const { getLink } = useRouter();
        const onClick = useCallback(() => {
            const modelId = parseAppName(state.app);
            const url = getLink(Routes.ContentEntries.List, {
                modelId,
                id: state.targetRevisionId,
                // TODO figure out how to load folderId
                folderId: "root"
            });

            console.log({
                modelId,
                url
            });

            const goTo = `${window.location.origin}${url}`;

            window.open(goTo, "_blank");
        }, [state.id]);
        console.log({
            renderingListOpenInNewWindowForState: state
        });

        return (
            <DropdownMenu.Item
                icon={<Icon icon={<OpenInNewIcon />} label={"Open In New Window"} />}
                text={"Open in New Window"}
                onClick={onClick}
            />
        );
    };
});
