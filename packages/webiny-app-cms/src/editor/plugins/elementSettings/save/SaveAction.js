import * as React from "react";
import { compose, withState, withHandlers, lifecycle } from "recompose";
import { graphql } from "react-apollo";
import SaveDialog from "./SaveDialog";
import { withSnackbar } from "webiny-app-admin/components";
import { withKeyHandler, withActiveElement } from "webiny-app-cms/editor/components";
import { createElementPlugin } from "webiny-app-cms/admin/components";
import { createElement } from "webiny-app-cms/admin/graphql/pages";

type Props = {
    isDialogOpened: boolean,
    showDialog: Function,
    hideDialog: Function,
    onSubmit: Function,
    children: React.Node,
    element: Object
};

const SaveAction = ({
    showDialog,
    hideDialog,
    isDialogOpened,
    children,
    onSubmit,
    element
}: Props) => {
    return (
        <React.Fragment>
            <SaveDialog
                open={isDialogOpened}
                onClose={hideDialog}
                onSubmit={onSubmit}
                element={element}
            />
            {React.cloneElement(children, { onClick: showDialog })}
        </React.Fragment>
    );
};

export default compose(
    withKeyHandler(),
    withState("isDialogOpened", "setOpenDialog", false),
    withHandlers({
        showDialog: ({ setOpenDialog }) => () => setOpenDialog(true),
        hideDialog: ({ setOpenDialog }) => () => setOpenDialog(false)
    }),
    graphql(createElement, { name: "createElement" }),
    withSnackbar(),
    withHandlers({
        onSubmit: ({ hideDialog, createElement, showSnackbar }) => async (formData: Object) => {
            hideDialog();
            const { data: res } = await createElement({ variables: { data: formData } });
            const { data } = res.cms.element;
            createElementPlugin(data);

            showSnackbar(
                <span>
                    Element <strong>{data.name}</strong> saved!
                </span>
            );
        }
    }),
    withActiveElement(),
    lifecycle({
        componentDidUpdate() {
            if (this.props.isDialogOpened) {
                // Need this to maintain the key press stack, as Material is handling ESC by itself.
                this.props.addKeyHandler("escape", () => {});
            } else {
                this.props.removeKeyHandler("escape");
            }
        }
    })
)(SaveAction);
