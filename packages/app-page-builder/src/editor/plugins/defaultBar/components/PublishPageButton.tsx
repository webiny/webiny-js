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
import {
    GET_PAGE,
    GetPageQueryVariables,
    GetPageQueryResponse,
    PageResponseData
} from "~/admin/graphql/pages";
import { pageAtom } from "../../../recoil/modules";
import {
    PUBLISH_PAGE,
    PublishPageMutationResponse,
    PublishPageMutationVariables
} from "./PublishPageButton/graphql";
import usePermission from "../../../../hooks/usePermission";

const PublishPageButton: React.FunctionComponent = () => {
    const page = useRecoilValue(pageAtom);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [publishRevision] = useMutation<
        PublishPageMutationResponse,
        PublishPageMutationVariables
    >(PUBLISH_PAGE, {
        refetchQueries: ["PbListPages"],
        update: (cache, result) => {
            if (!result || !result.data) {
                return;
            }
            // Don't do anything if there was an error during publishing!
            if (result.data.pageBuilder.publishPage.error) {
                return;
            }

            // Update revisions
            let pageFromCache: GetPageQueryResponse;
            try {
                pageFromCache = cloneDeep(
                    cache.readQuery<GetPageQueryResponse, GetPageQueryVariables>({
                        query: GET_PAGE,
                        variables: {
                            id: page.id as string
                        }
                    })
                ) as GetPageQueryResponse;
            } catch {
                // This means page could not be found in the cache. Exiting...
                return;
            }

            const revisions = get(
                pageFromCache,
                "pageBuilder.getPage.data.revisions",
                []
            ) as PageResponseData["revisions"];
            revisions.forEach(revision => {
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
                    onClick={() => {
                        showConfirmation(async () => {
                            const response = await publishRevision({
                                variables: {
                                    id: page.id as string
                                }
                            });
                            if (!response || !response.data) {
                                showSnackbar("No response data from Publish Revision Mutation.");
                                return;
                            }
                            const { error } = response.data.pageBuilder.publishPage;
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

export default PublishPageButton;
