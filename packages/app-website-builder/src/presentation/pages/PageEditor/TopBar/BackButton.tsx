import React, { useCallback } from "react";
import { IconButton } from "@webiny/admin-ui";
import { useRoute, useRouter } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Routes } from "~/routes.js";
import { ROOT_FOLDER } from "~/constants.js";

export function BackButton() {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Pages.Editor);
    const editor = useDocumentEditor();

    const onClick = useCallback(() => {
        const document = editor.getDocumentState().read();
        const folderId = route.params.folderId ?? document.properties.folderId ?? ROOT_FOLDER;

        goToRoute(Routes.Pages.List, { folderId });
    }, [route]);

    return <IconButton variant={"ghost"} size={"md"} onClick={onClick} icon={<BackIcon />} />;
}
