import React, { useCallback } from "react";
import { IconButton } from "@webiny/admin-ui";
import { useLocation, useNavigate, useRouter } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { useDocumentEditor } from "~/DocumentEditor";

export function BackButton() {
    const { key } = useLocation();
    const navigate = useNavigate();
    const { search } = useRouter();
    const editor = useDocumentEditor();

    const onClick = useCallback(() => {
        const document = editor.getDocumentState().read();
        const folderId = search[0].get("folderId") ?? document.properties.folderId ?? "root";

        navigate(`/website-builder/pages?folderId=${encodeURIComponent(folderId)}`);
    }, [key, navigate]);

    return (
        <>
            <IconButton variant={"ghost"} size={"md"} onClick={onClick} icon={<BackIcon />} />
        </>
    );
}
