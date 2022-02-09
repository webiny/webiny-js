import React from "react";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ButtonPrimary } from "@webiny/ui/Button";
import usePermission from "~/hooks/usePermission";
import { pageAtom } from "~/editor/recoil/modules";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";

const PublishPageButton: React.FunctionComponent = () => {
    const page = useRecoilValue(pageAtom);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();
    const { canPublish } = usePermission();

    if (!canPublish()) {
        return null;
    }

    return (
        <ConfirmationDialog
            data-testid={"pb-editor-publish-confirmation-dialog"}
            title="Publish page"
            message="You are about to publish this page, are you sure want to continue?"
        >
            {({ showConfirmation }) => (
                <ButtonPrimary
                    onClick={async () => {
                        showConfirmation(async () => {
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
                                return showSnackbar(error.message);
                            }

                            history.push(`/page-builder/pages?id=${encodeURIComponent(page.id)}`);

                            // Let's wait a bit, because we are also redirecting the user.
                            setTimeout(() => {
                                showSnackbar("Your page was published successfully!");
                            }, 500);
                        });
                    }}
                >
                    {page.version > 1 ? "Publish changes" : "Publish"}
                </ButtonPrimary>
            )}
        </ConfirmationDialog>
    );
};

export default PublishPageButton;
