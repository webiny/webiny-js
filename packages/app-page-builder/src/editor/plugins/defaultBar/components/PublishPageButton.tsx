import React from "react";
import { useRecoilValue } from "recoil";
import { useMutation } from "@apollo/react-hooks";
import set from "lodash/set";
import get from "lodash/get";
import cloneDeep from "lodash/cloneDeep";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ButtonPrimary } from "@webiny/ui/Button";
import { GET_PAGE } from "~/admin/graphql/pages";
import { pageAtom } from "../../../recoil/modules";
import { PUBLISH_PAGE } from "./PublishPageButton/graphql";
import usePermission from "../../../../hooks/usePermission";
import { PbPageData, PbPageRevision } from "~/types";

const PublishPageButton: React.FunctionComponent = () => {
    const page = useRecoilValue(pageAtom);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [publishRevision] = useMutation(PUBLISH_PAGE, {
        refetchQueries: ["PbListPages"],
        update: (cache, { data }) => {
            // Don't do anything if there was an error during publishing!
            if (data.pageBuilder.publishPage.error) {
                return;
            }

            // Update revisions
            let pageFromCache: PbPageData;
            try {
                pageFromCache = cloneDeep(
                    cache.readQuery({
                        query: GET_PAGE,
                        variables: { id: page.id }
                    })
                );
            } catch {
                // This means page could not be found in the cache. Exiting...
                return;
            }

            const revisions = get(pageFromCache, "pageBuilder.getPage.data.revisions", []);
            revisions.forEach((revision: PbPageRevision) => {
                // Update published/locked fields on the revision that was just published.
                if (revision.id === page.id) {
                    revision.status = "published";
                    revision.locked = true;
                    return;
                }

                // Unpublish other published revisions
                if (revision.status === "published") {
                    revision.status = "unpublished";
                }
            });

            // Write our data back to the cache.
            cache.writeQuery({
                query: GET_PAGE,
                data: set(pageFromCache, "pageBuilder.getPage.data.revisions", revisions)
            });
        }
    });
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
                            const response = await publishRevision({
                                variables: {
                                    id: page.id
                                }
                            });

                            const { error } = response.data.pageBuilder.publishPage;
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
