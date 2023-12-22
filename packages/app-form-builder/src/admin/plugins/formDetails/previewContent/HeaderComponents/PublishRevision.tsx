import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "../../../../icons/publish.svg";
import { ReactComponent as UnpublishIcon } from "../../../../icons/unpublish.svg";
import {
    PUBLISH_REVISION,
    PublishRevisionMutationResponse,
    PublishRevisionMutationVariables,
    UNPUBLISH_REVISION,
    UnpublishRevisionMutationResponse,
    UnpublishRevisionMutationVariable
} from "~/admin/graphql";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useApolloClient } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FbRevisionModel } from "~/types";
import { usePermission } from "~/hooks/usePermission";

interface PublishRevisionProps {
    revision: FbRevisionModel;
}

const PublishRevision = ({ revision }: PublishRevisionProps) => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { canPublish, canUnpublish } = usePermission();

    return (
        <React.Fragment>
            {revision.status !== "published" && canPublish() && (
                <Tooltip content={"Publish"} placement={"top"}>
                    <ConfirmationDialog
                        title={"Publish form"}
                        message={
                            "You are about to publish this form, are you sure want to continue?"
                        }
                        data-testid={"fb.form-preview.header.publish-dialog"}
                    >
                        {({ showConfirmation }) => (
                            <IconButton
                                data-testid={"fb.form-preview.header.publish"}
                                icon={<PublishIcon />}
                                onClick={() =>
                                    showConfirmation(async () => {
                                        const { data: res } = await client.mutate<
                                            PublishRevisionMutationResponse,
                                            PublishRevisionMutationVariables
                                        >({
                                            mutation: PUBLISH_REVISION,
                                            variables: { revision: revision.id }
                                        });

                                        if (!res) {
                                            showSnackbar(
                                                "Missing response data on Publish Revision Mutation."
                                            );
                                            return;
                                        }

                                        const { error } = res.formBuilder.publishRevision;
                                        if (error) {
                                            showSnackbar(error.message);
                                            return;
                                        }

                                        showSnackbar(
                                            <span>
                                                Successfully published revision{" "}
                                                <strong>#{revision.version}</strong>!
                                            </span>
                                        );
                                    })
                                }
                            />
                        )}
                    </ConfirmationDialog>
                </Tooltip>
            )}
            {revision.status === "published" && canUnpublish() && (
                <Tooltip content={"Unpublish"} placement={"top"}>
                    <ConfirmationDialog
                        title={"Un-publish form"}
                        message={
                            "You are about to unpublish this form, are you sure want to continue?"
                        }
                        data-testid={"fb.form-preview.header.unpublish-dialog"}
                    >
                        {({ showConfirmation }) => (
                            <IconButton
                                data-testid={"fb.form-preview.header.unpublish"}
                                icon={<UnpublishIcon />}
                                onClick={() =>
                                    showConfirmation(async () => {
                                        const { data: res } = await client.mutate<
                                            UnpublishRevisionMutationResponse,
                                            UnpublishRevisionMutationVariable
                                        >({
                                            mutation: UNPUBLISH_REVISION,
                                            variables: { revision: revision.id }
                                        });
                                        if (!res) {
                                            showSnackbar(
                                                "Missing response data on Unpublish Revision Mutation."
                                            );
                                            return;
                                        }

                                        const { error } = res.formBuilder.unpublishRevision;
                                        if (error) {
                                            showSnackbar(error.message);
                                            return;
                                        }

                                        showSnackbar(
                                            <span>
                                                Successfully unpublished revision{" "}
                                                <strong>#{revision.version}</strong>!
                                            </span>
                                        );
                                    })
                                }
                            />
                        )}
                    </ConfirmationDialog>
                </Tooltip>
            )}
        </React.Fragment>
    );
};

export default PublishRevision;
