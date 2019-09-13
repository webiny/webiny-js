// @flow
import React from "react";
import dot from "dot-prop-immutable";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { withConfirmation } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "@webiny/app-page-builder/admin/assets/delete.svg";
import { DELETE_PAGE } from "@webiny/app-page-builder/admin/graphql/pages";

const DeletePage = props => {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();
    const { showDialog } = useDialog();

    const confirmDelete = useHandler(props, ({ pageDetails: { page }, showConfirmation }) => () => {
        showConfirmation(async () => {
            const { data: res } = await client.mutate({
                mutation: DELETE_PAGE,
                variables: { id: page.parent },
                refetchQueries: ["PbListPages"]
            });
            const { error } = dot.get(res, "pageBuilder.deletePage");
            if (error) {
                return showDialog(error.message, { title: "Could not delete page" });
            }

            showSnackbar(
                <span>
                    The page{" "}
                    <strong>
                        {page.title.substr(0, 20)}
                        ...
                    </strong>{" "}
                    was deleted successfully!
                </span>
            );

            history.push("/page-builder/pages");
        });
    });

    return (
        <Tooltip content={"Delete"} placement={"top"}>
            <IconButton icon={<DeleteIcon />} onClick={confirmDelete} />
        </Tooltip>
    );
};

export default withConfirmation(({ pageDetails: { page } }) => ({
    title: "Delete page",
    message: (
        <p>
            You are about to delete the entire page and all of its revisions! <br />
            Are you sure you want to permanently delete the page <strong>{page.title}</strong>?
        </p>
    )
}))(DeletePage);
