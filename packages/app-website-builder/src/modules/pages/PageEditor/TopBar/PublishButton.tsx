import React from "react";
import { Button, useToast } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { ReactComponent as PublishIcon } from "@webiny/icons/publish.svg";
import { usePublishPage } from "~/features/pages/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { useRouter } from "@webiny/app-admin";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { Routes } from "~/routes.js";

export const PublishButton = () => {
    const { goToRoute } = useRouter();
    const { showSuccessToast } = useToast();
    const { publishPage } = usePublishPage();
    const { showDialog } = useDialogs();

    const folderId = useSelectFromDocument<string, EditorPage>(
        document => document.location.folderId
    );
    const id = useSelectFromDocument(document => document.id);

    const publish = () => {
        showDialog({
            title: "Publish page",
            icon: <PublishIcon />,
            content: "You're about to publish this page. Are you sure you want to continue?",
            acceptLabel: "Yes, publish this page!",
            cancelLabel: "Cancel",
            onAccept: async () => {
                await publishPage({ id });

                showSuccessToast({
                    title: "Page was published successfully!"
                });

                goToRoute(Routes.Pages.List, { folderId });
            }
        });
    };

    return (
        <Button
            variant="primary"
            text={"Publish"}
            onClick={publish}
            icon={<PublishIcon />}
        ></Button>
    );
};
