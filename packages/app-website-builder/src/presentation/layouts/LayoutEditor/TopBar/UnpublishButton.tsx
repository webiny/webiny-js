import React from "react";
import { Button } from "@webiny/admin-ui";
import { useDialogs, useRouter } from "@webiny/app-admin";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { Routes } from "~/routes.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { useLayoutRevisions } from "../Revisions/useLayoutRevisions.js";

// Shown for the published revision. A layout in use can't be unpublished: the error explains why.
export const UnpublishButton = () => {
    const { goToRoute } = useRouter();
    const { showDialog } = useDialogs();
    const editor = useDocumentEditor<LayoutEditorDocument>();
    const presenter = useLayoutRevisions();
    const status = useSelectFromDocument<string, LayoutEditorDocument>(document => document.status);

    if (status !== "published") {
        return null;
    }

    const unpublish = () => {
        showDialog({
            title: "Unpublish layout",
            icon: <UnpublishIcon />,
            content:
                "You are about to unpublish this layout. Pages can't use it until a revision is published again. Are you sure you want to continue?",
            acceptLabel: "Yes, unpublish this layout!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                const document = editor.getDocumentState().read();
                const unpublished = await presenter.unpublish({
                    id: document.id,
                    version: document.version
                });
                if (unpublished) {
                    goToRoute(Routes.Layouts.List);
                }
            }
        });
    };

    return (
        <Button
            variant={"secondary"}
            text={"Unpublish"}
            onClick={unpublish}
            icon={<UnpublishIcon />}
        />
    );
};
