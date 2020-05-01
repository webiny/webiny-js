import React, { useMemo } from "react";
import dot from "dot-prop-immutable";
import useReactRouter from "use-react-router";
import { get } from "lodash";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/delete.svg";
import { createDeleteMutation } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";

const DeleteContent = props => {
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();
    const { showDialog } = useDialog();

    const { contentModel } = props;
    const title = get(props, "pageDetails.page.title", "N/A");

    const DELETE_CONTENT = useMemo(() => {
        return createDeleteMutation(contentModel);
    }, [contentModel.modelId]);

    const [deleteContentMutation] = useMutation(DELETE_CONTENT);

    const { showConfirmation } = useConfirmationDialog({
        title: "Delete page",
        message: (
            <p>
                You are about to delete the entire page and all of its revisions! <br />
                Are you sure you want to permanently delete the page <strong>{title}</strong>?
            </p>
        )
    });

    const confirmDelete = useHandler(
        { ...props, showConfirmation },
        ({ pageDetails: { page }, showConfirmation }) => () => {
            showConfirmation(async () => {
                const { data: res } = await deleteContentMutation({
                    variables: { id: page.parent },
                    refetchQueries: ["PbListPages"]
                });

                const { error } = dot.get(res, "pageBuilder.deleteContent");
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
        }
    );

    return (
        <Tooltip content={"Delete"} placement={"top"}>
            <IconButton icon={<DeleteIcon />} onClick={confirmDelete} />
        </Tooltip>
    );
};

export default DeleteContent;
