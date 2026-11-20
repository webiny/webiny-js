import React from "react";
import { Button } from "@webiny/admin-ui";
import { useDialogs, useRouter } from "@webiny/app-admin";
import { ReactComponent as NewRevisionIcon } from "@webiny/icons/add.svg";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Routes } from "~/routes.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { useLayoutRevisions } from "../Revisions/useLayoutRevisions.js";

// A published or locked revision can't change: edit a new revision created from it.
export const NewRevisionButton = () => {
    const { goToRoute } = useRouter();
    const { showDialog } = useDialogs();
    const editor = useDocumentEditor<LayoutEditorDocument>();
    const presenter = useLayoutRevisions();

    const createNewRevision = () => {
        showDialog({
            title: "Create a new layout revision",
            icon: <NewRevisionIcon />,
            content:
                "You're about to create a new revision of this layout. Are you sure you want to continue?",
            acceptLabel: "Yes, create new revision!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                const document = editor.getDocumentState().read();
                const revision = await presenter.createRevisionFrom({
                    id: document.id,
                    version: document.version
                });
                if (revision) {
                    goToRoute(Routes.Layouts.Editor, { id: revision.id });
                }
            }
        });
    };

    return (
        <Button
            variant={"primary"}
            text={"New Revision"}
            onClick={createNewRevision}
            icon={<NewRevisionIcon />}
        />
    );
};
