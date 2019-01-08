// @flow
import * as React from "react";
import { graphql } from "react-apollo";
import { compose, withHandlers, withState } from "recompose";
import styled from "react-emotion";
import { unregisterPlugin } from "webiny-plugins";
import { Typography } from "webiny-ui/Typography";
import { IconButton } from "webiny-ui/Button";
import { withSnackbar } from "webiny-admin/components";
import { withConfirmation, type WithConfirmationProps } from "webiny-ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/close.svg";
import { ReactComponent as EditIcon } from "webiny-app-cms/editor/assets/icons/edit.svg";
import { deleteElement } from "./graphql";
import EditElementDialog from "./EditElementDialog";
import createElementPlugin from "webiny-app-cms/admin/components/withSavedElements/createElementPlugin";
import { updateElement } from "./graphql";

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

type Props = WithConfirmationProps & {
    title: string,
    plugin: string,
    refresh: Function,
    deleteElement: Function,
    updateElement: Function,
    editDialogOpened: Function,
    openEditDialog: Function
};

const Title = (props: Props) => {
    const {
        plugin: pluginName,
        deleteElement,
        title,
        updateElement,
        editDialogOpened,
        openEditDialog
    } = props;

    return (
        <>
            <Typography use="overline">
                {title}
                <>
                    <EditIconWrapper>
                        <IconButton icon={<EditIcon />} onClick={() => openEditDialog(true)} />
                    </EditIconWrapper>{" "}
                    <EditElementDialog
                        onSubmit={updateElement}
                        plugin={pluginName}
                        open={!!editDialogOpened}
                        onClose={() => openEditDialog(false)}
                    />
                </>

                <DeleteIconWrapper>
                    <IconButton icon={<DeleteIcon />} onClick={deleteElement} />
                </DeleteIconWrapper>
            </Typography>
        </>
    );
};

export default compose(
    withConfirmation(({ title }) => ({
        title: "Delete saved element",
        message: (
            <p>
                Are you sure you want to permanently delete the <strong>{title}</strong> element?
            </p>
        )
    })),
    withSnackbar(),
    withState("editDialogOpened", "openEditDialog", false),
    graphql(deleteElement, { name: "deleteElement" }),
    graphql(updateElement, { name: "updateElement" }),
    withHandlers({
        deleteElement: ({
            id,
            title,
            plugin,
            showConfirmation,
            showSnackbar,
            deleteElement,
            refresh
        }) => () => {
            showConfirmation(async () => {
                const { data: res } = await deleteElement({
                    variables: { id }
                });

                const { error } = res.cms.deleteElement;
                if (error) {
                    return showSnackbar(error.message);
                }

                unregisterPlugin(plugin);

                refresh();

                showSnackbar(
                    <span>
                        Element <strong>{title}</strong> deleted!
                    </span>
                );
            });
        },
        updateElement: ({
            id,
            showSnackbar,
            updateElement,
            openEditDialog,
            refresh
        }) => async plugin => {
            const { title: name } = plugin;
            const response = await updateElement({
                variables: {
                    id,
                    data: { name }
                }
            });

            const { error, data } = response.data.cms.updateElement;
            if (error) {
                openEditDialog(false);
                setTimeout(() => {
                    // For better UX, success message is shown after 300ms has passed.
                    showSnackbar(error.message);
                }, 300);

                return;
            }

            // This will replace previously registered block plugin.
            createElementPlugin(data);
            openEditDialog(false);
            refresh();

            setTimeout(() => {
                // For better UX, success message is shown after 300ms has passed.
                showSnackbar("Element " + plugin.title + " successfully saved.");
            }, 300);
        }
    })
)(Title);
