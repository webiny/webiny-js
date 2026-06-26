import React from "react";
import { Button, useToast } from "@webiny/admin-ui";
import { useDialogs, useRouter } from "@webiny/app-admin";
import { ReactComponent as NewRevisionIcon } from "@webiny/icons/add.svg";
import { useCreatePageRevisionFrom } from "~/features/pages/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { Routes } from "~/routes.js";

export const NewRevisionButton = () => {
    const { goToRoute } = useRouter();
    const { showSuccessToast } = useToast();
    const { createPageRevisionFrom } = useCreatePageRevisionFrom();
    const { showDialog } = useDialogs();

    const id = useSelectFromDocument(document => document.id);

    const publish = () => {
        showDialog({
            title: "Create a new page revision",
            icon: <NewRevisionIcon />,
            content:
                "You're about to create a new revision of this page. Are you sure you want to continue?",
            acceptLabel: "Yes, create new revision!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                const result = await createPageRevisionFrom({ id });

                showSuccessToast({
                    title: "New revision was created successfully!"
                });

                goToRoute(Routes.Pages.Editor, {
                    id: result.id
                });
            }
        });
    };

    return (
        <Button
            variant="primary"
            text={"New Revision"}
            onClick={publish}
            icon={<NewRevisionIcon />}
        />
    );
};
