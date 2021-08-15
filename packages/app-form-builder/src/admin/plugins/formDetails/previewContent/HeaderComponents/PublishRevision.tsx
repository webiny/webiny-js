import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "../../../../icons/publish.svg";
import { ReactComponent as UnpublishIcon } from "../../../../icons/unpublish.svg";
import { PUBLISH_REVISION, UNPUBLISH_REVISION } from "../../../../graphql";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useApolloClient } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FbRevisionModel } from "../../../../../types";
import usePermission from "../../../../../hooks/usePermission";

type PublishRevisionProps = {
    revision: FbRevisionModel;
};

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
                                        const { data: res } = await client.mutate({
                                            mutation: PUBLISH_REVISION,
                                            variables: { revision: revision.id }
                                        });

                                        const { error } = res.formBuilder.publishRevision;
                                        if (error) {
                                            return showSnackbar(error.message);
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
                                        const { data: res } = await client.mutate({
                                            mutation: UNPUBLISH_REVISION,
                                            variables: { revision: revision.id }
                                        });

                                        const { error } = res.formBuilder.unpublishRevision;
                                        if (error) {
                                            return showSnackbar(error.message);
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
