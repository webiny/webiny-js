import React, { useCallback } from "react";
import get from "lodash/get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ButtonPrimary } from "@webiny/ui/Button";
import { usePagesPermissions } from "~/hooks/permissions";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { createComponentPlugin, makeComposable } from "@webiny/app-admin";
import { EditorBar } from "~/editor";
import { usePage } from "~/pageEditor/hooks/usePage";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";

const DefaultPublishPageButton = () => {
    const [page] = usePage();
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();
    const { canPublish } = usePagesPermissions();
    const { navigateToLatestFolder } = useNavigatePage();

    if (!canPublish()) {
        return null;
    }

    const publishChanges = useCallback(async () => {
        const response = await pageBuilder.publishPage(page as { id: string }, {
            client: pageBuilder.client
        });
        /**
         * In case of exit in "publishPage" lifecycle, "publishPage" hook will return undefined,
         * indicating an immediate exit.
         */
        if (!response) {
            return;
        }

        const error = get(response, "error");
        if (error) {
            showSnackbar(error.message);
            return;
        }

        navigateToLatestFolder();

        // Let's wait a bit, because we are also redirecting the user.
        setTimeout(() => {
            showSnackbar("Your page was published successfully!");
        }, 500);
    }, [page.id]);

    return (
        <ConfirmationDialog
            data-testid={"pb-editor-publish-confirmation-dialog"}
            title="Publish page"
            message="You are about to publish this page, are you sure want to continue?"
        >
            {({ showConfirmation }) => (
                <ButtonPrimary
                    onClick={() => showConfirmation(publishChanges)}
                    data-testid="pb.editor.header.publish.button"
                >
                    {page.version > 1 ? "Publish changes" : "Publish"}
                </ButtonPrimary>
            )}
        </ConfirmationDialog>
    );
};

export const PublishPageButton = makeComposable("PublishPageButton", DefaultPublishPageButton);

export const PublishPageButtonPlugin = createComponentPlugin(
    EditorBar.RightSection,
    RightSection => {
        return function AddPublishPageButton(props) {
            return (
                <RightSection>
                    <PublishPageButton />
                    {props.children}
                </RightSection>
            );
        };
    }
);
