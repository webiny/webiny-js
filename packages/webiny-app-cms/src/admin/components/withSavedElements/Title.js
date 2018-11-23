// @flow
import * as React from "react";
import { graphql } from "react-apollo";
import { compose, withHandlers } from "recompose";
import styled from "react-emotion";
import { removePlugin } from "webiny-app/plugins";
import { Typography } from "webiny-ui/Typography";
import { IconButton } from "webiny-ui/Button";
import { withSnackbar } from "webiny-app-admin/components";
import { withConfirmation, type WithConfirmationProps } from "webiny-ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/close.svg";
import { deleteElement } from "./graphql";

const Icon = styled("div")({
    position: "absolute",
    top: 0,
    right: 15
});

type Props = WithConfirmationProps & {
    title: string,
    onDelete: Function
};

const Title = ({ title, onDelete }: Props) => {
    return (
        <Typography use="overline">
            {title}
            <Icon>
                <IconButton icon={<DeleteIcon />} onClick={onDelete} />
            </Icon>
        </Typography>
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
    graphql(deleteElement, { name: "deleteElement" }),
    withHandlers({
        onDelete: ({
            id,
            title,
            plugin,
            showConfirmation,
            showSnackbar,
            deleteElement,
            onDelete
        }) => () => {
            showConfirmation(async () => {
                const { data: res } = await deleteElement({
                    variables: { id }
                });

                const { error } = res.cms.deleteElement;
                if (error) {
                    return showSnackbar(error.message);
                }

                removePlugin(plugin);

                if (typeof onDelete === "function") {
                    onDelete();
                }

                showSnackbar(
                    <span>
                        Element <strong>{title}</strong> deleted!
                    </span>
                );
            });
        }
    })
)(Title);
