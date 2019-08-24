// @flow
import React from "react";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as PublishIcon } from "webiny-app-forms/admin/icons/publish.svg";
import { ReactComponent as UnpublishIcon } from "webiny-app-forms/admin/icons/unpublish.svg";
import { publishRevision, unpublishRevision } from "webiny-app-forms/admin/viewsGraphql";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { graphql } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import { compose } from "recompose";

const PublishRevision = ({
    showSnackbar,
    revision,
    gqlPublishRevision,
    gqlUnpublishRevision
}: *) => {
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
                                        const { data: res } = await gqlPublishRevision({
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
                                        const { data: res } = await gqlUnpublishRevision({
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

export default compose(
    withSnackbar(),
    graphql(publishRevision, { name: "gqlPublishRevision" }),
    graphql(unpublishRevision, { name: "gqlUnpublishRevision" })
)(PublishRevision);
