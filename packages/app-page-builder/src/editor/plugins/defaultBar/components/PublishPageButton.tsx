import React from "react";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ButtonPrimary } from "@webiny/ui/Button";
import usePermission from "~/hooks/usePermission";
import { pageAtom, PageAtomType } from "~/editor/recoil/modules";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { makeComposable } from "@webiny/app-admin";

export interface PublishPageButtonProps {
    page: PageAtomType;
}

const PublishPageButton: React.FC<PublishPageButtonProps> = props => {
    const { page } = props;
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
                    onClick={() => {
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
                                showSnackbar(error.message);
                                return;
                            }

                            history.push(
                                `/page-builder/pages?id=${encodeURIComponent(page.id as string)}`
                            );

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

export const PublishPageButtonComposable = makeComposable("PublishPageButton", PublishPageButton);

const DefaultPublishPageButton = () => {
    const page = useRecoilValue(pageAtom);
    return <PublishPageButtonComposable page={page} />;
};

export default DefaultPublishPageButton;
