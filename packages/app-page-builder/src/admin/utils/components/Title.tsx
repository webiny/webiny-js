import React, { useState, useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import styled from "@emotion/styled";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { plugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { IconButton } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ReactComponent as DeleteIcon } from "../../../editor/assets/icons/close.svg";
import { ReactComponent as EditIcon } from "../../../editor/assets/icons/edit.svg";
import { DELETE_PAGE_ELEMENT, UPDATE_PAGE_ELEMENT } from "./graphql";
import EditElementDialog from "./EditElementDialog";
import createElementPlugin from "../createElementPlugin";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";

const EditIconWrapper = styled("div")({
    position: "absolute",
    top: 0,
    right: 48
});
const DeleteIconWrapper = styled("div")({
    position: "absolute",
    top: 0,
    right: 16
});

interface TitleProps {
    id: string;
    title: string;
    plugin: string;
    refresh: () => void;
}
const Title = (props: TitleProps) => {
    const { plugin: pluginName, title } = props;

    const client = useApolloClient();
    const [editDialogOpened, setEditDialog] = useState(false);
    const { showSnackbar } = useSnackbar();

    const openEditDialog = useCallback(() => setEditDialog(true), []);
    const closeEditDialog = useCallback(() => setEditDialog(false), []);

    const { onSubmit } = useHandlers(props, {
        onSubmit:
            ({ id, refresh }) =>
            async plugin => {
                const { title: name } = plugin;
                const response = await client.mutate({
                    mutation: UPDATE_PAGE_ELEMENT,
                    variables: {
                        id,
                        data: { name }
                    }
                });

                const { error, data } = response.data.pageBuilder.updatePageElement;
                if (error) {
                    closeEditDialog();
                    setTimeout(() => {
                        // For better UX, success message is shown after 300ms has passed.
                        showSnackbar(error.message);
                    }, 300);

                    return;
                }

                // This will replace previously registered block plugin.
                createElementPlugin(data);
                closeEditDialog();
                refresh();

                setTimeout(() => {
                    // For better UX, success message is shown after 300ms has passed.
                    showSnackbar("Element " + plugin.title + " successfully saved.");
                }, 300);
            }
    });

    return (
        <ConfirmationDialog
            title="Delete saved element"
            message={
                <p>
                    Are you sure you want to permanently delete the <strong>{title}</strong>{" "}
                    element?
                </p>
            }
        >
            {({ showConfirmation }) => (
                <Typography use="overline">
                    {title}
                    <>
                        <EditIconWrapper>
                            <IconButton icon={<EditIcon />} onClick={openEditDialog} />
                        </EditIconWrapper>{" "}
                        <EditElementDialog
                            onSubmit={onSubmit}
                            plugin={pluginName}
                            open={!!editDialogOpened}
                            onClose={closeEditDialog}
                        />
                    </>

                    <DeleteIconWrapper>
                        <IconButton
                            icon={<DeleteIcon />}
                            onClick={() =>
                                showConfirmation(async () => {
                                    const { plugin, refresh, id } = props;
                                    const { data: res } = await client.mutate({
                                        mutation: DELETE_PAGE_ELEMENT,
                                        variables: { id }
                                    });

                                    const { error } = res.pageBuilder.deletePageElement;
                                    if (error) {
                                        return showSnackbar(error.message);
                                    }

                                    plugins.unregister(plugin);

                                    refresh();

                                    showSnackbar(
                                        <span>
                                            Element <strong>{title}</strong> deleted!
                                        </span>
                                    );
                                })
                            }
                        />
                    </DeleteIconWrapper>
                </Typography>
            )}
        </ConfirmationDialog>
    );
};

export default Title;
