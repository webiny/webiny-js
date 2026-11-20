import React from "react";
import { Button } from "@webiny/admin-ui";
import { useDialogs, useRouter } from "@webiny/app-admin";
import { ReactComponent as PublishIcon } from "@webiny/icons/publish.svg";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Routes } from "~/routes.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { useLayoutRevisions } from "../Revisions/useLayoutRevisions.js";

export const PublishButton = () => {
    const { goToRoute } = useRouter();
    const { showDialog } = useDialogs();
    const editor = useDocumentEditor<LayoutEditorDocument>();
    const presenter = useLayoutRevisions();

    const publish = () => {
        showDialog({
            title: "Publish layout",
            icon: <PublishIcon />,
            content:
                "You are about to publish this layout. Pages using it are rendered in this revision. Are you sure you want to continue?",
            acceptLabel: "Yes, publish this layout!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                const document = editor.getDocumentState().read();
                const published = await presenter.publish({
                    id: document.id,
                    version: document.version
                });
                if (published) {
                    goToRoute(Routes.Layouts.List);
                }
            }
        });
    };

    return <Button variant={"primary"} text={"Publish"} onClick={publish} icon={<PublishIcon />} />;
};
