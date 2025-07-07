import React, { useCallback } from "react";
import { IconButton } from "@webiny/admin-ui";
import { useLocation, useNavigate } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { useDocumentEditor } from "~/DocumentEditor";

export function BackButton() {
    const { key } = useLocation();
    const navigate = useNavigate();
    const editor = useDocumentEditor();

    const onClick = useCallback(() => {
        const document = editor.getDocumentState().read();
        const folderId = document.properties.folderId ?? "root";

        // If location.key is "default", then we are in a new tab.
        if (key === "default") {
            navigate(`/website-builder/pages?folderId=${folderId}`);
        } else {
            navigate(-1);
        }
    }, [key, navigate]);

    return (
        <>
            <IconButton variant={"ghost"} size={"md"} onClick={onClick} icon={<BackIcon />} />
        </>
    );
}
