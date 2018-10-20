import React from "react";
import { compose, withProps, withHandlers } from "recompose";
import dot from "dot-prop-immutable";
import { withApollo, graphql } from "react-apollo";
import { withRouter } from "webiny-app/components";
import { withDialog, withSnackbar } from "webiny-app-admin/components";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { withConfirmation, type WithConfirmationProps } from "webiny-ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/admin/assets/delete.svg";
import { fragments, deletePage, loadPages } from "webiny-app-cms/admin/graphql/pages";

type Props = WithConfirmationProps & {
    confirmDelete: Function
};

const DeletePage = ({ confirmDelete }: Props) => {
    return (
        <Tooltip content={"Delete"} placement={"top"}>
            <IconButton icon={<DeleteIcon />} onClick={confirmDelete} />
        </Tooltip>
    );
};

export default compose(
    withRouter(),
    withApollo,
    withProps(({ pageDetails, client }) => {
        // Get current page title from cache - no need to do an API call for a small piece of data.
        try {
            const data = client.readFragment({
                id: pageDetails.pageId,
                fragment: fragments.activeRevision
            });

            return { pageTitle: data ? data.activeRevision.title : "" };
        } catch (e) {
            return { pageTitle: "" };
        }
    }),
    withConfirmation(({ pageTitle }) => ({
        title: "Delete page",
        message: (
            <p>
                You are about to delete the entire page and all of its revisions! <br />
                Are you sure you want to permanently delete the page <strong>{pageTitle}</strong>?
            </p>
        )
    })),
    graphql(deletePage, { name: "deletePage" }),
    withDialog(),
    withSnackbar(),
    withHandlers({
        confirmDelete: ({
            client,
            pageTitle,
            router,
            showConfirmation,
            deletePage,
            pageDetails,
            showDialog,
            showSnackbar
        }) => () => {
            showConfirmation(async () => {
                const { data: res } = await deletePage({
                    variables: { id: pageDetails.pageId },
                    refetchQueries: ["CmsListPages"]
                });
                const { error } = dot.get(res, "cms.deletePage");
                if (error) {
                    return showDialog(error.message, { title: "Could not delete page" });
                }

                showSnackbar(
                    <span>
                        The page{" "}
                        <strong>
                            {pageTitle.substr(0, 20)}
                            ...
                        </strong>{" "}
                        was deleted successfully!
                    </span>
                );

                router.goToRoute({ name: "Cms.Pages" });
            });
        }
    })
)(DeletePage);
