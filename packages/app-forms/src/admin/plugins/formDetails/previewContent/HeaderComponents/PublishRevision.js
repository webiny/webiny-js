// @flow
import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "@webiny/app-forms/admin/icons/publish.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/app-forms/admin/icons/unpublish.svg";
import { PUBLISH_REVISION, UNPUBLISH_REVISION } from "@webiny/app-forms/admin/viewsGraphql";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useApolloClient } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

const PublishRevision = ({ revision }: *) => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    return (
        <React.Fragment>
            {revision.status !== "published" ? (
                <Tooltip content={"Publish"} placement={"top"}>
                    <ConfirmationDialog
                        title={"Publish form"}
                        message={
                            "You are about to publish this form, are you sure want to continue?"
                        }
                    >
                        {({ showConfirmation }) => (
                            <IconButton
                                icon={<PublishIcon />}
                                onClick={() =>
                                    showConfirmation(async () => {
                                        const { data: res } = await client.mutate({
                                            mutation: PUBLISH_REVISION,
                                            variables: { id: revision.id }
                                        });

                                        const { error } = res.forms.publishRevision;
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
            ) : (
                <Tooltip content={"Unpublish"} placement={"top"}>
                    <ConfirmationDialog
                        title={"Un-publish form"}
                        message={
                            "You are about to unpublish this form, are you sure want to continue?"
                        }
                    >
                        {({ showConfirmation }) => (
                            <IconButton
                                icon={<UnpublishIcon />}
                                onClick={() =>
                                    showConfirmation(async () => {
                                        const { data: res } = await client.mutate({
                                            mutation: UNPUBLISH_REVISION,
                                            variables: { id: revision.id }
                                        });

                                        const { error } = res.forms.unpublishRevision;
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
