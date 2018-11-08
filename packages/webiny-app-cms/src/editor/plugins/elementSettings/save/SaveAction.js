import * as React from "react";
import { compose, withState, withHandlers, lifecycle } from "recompose";
import { graphql } from "react-apollo";
import SaveDialog from "./SaveDialog";
import { withSnackbar } from "webiny-app-admin/components";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { createElementPlugin, createBlockPlugin } from "webiny-app-cms/admin/components";
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
                type={element.type === "cms-element-block" ? "block" : "element"}
            />
            {React.cloneElement(children, { onClick: showDialog })}
        </React.Fragment>
    );
};

const removeIdsAndPaths = el => {
    delete el.id;
    delete el.path;

    el.elements = el.elements.map(el => {
        delete el.id;
        delete el.path;
        if (el.elements.length) {
            el = removeIdsAndPaths(el);
        }

        return el;
    });

    return el;
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
        onSubmit: ({ element, hideDialog, createElement, showSnackbar }) => async (
            formData: Object
        ) => {
            hideDialog();
            formData.content = removeIdsAndPaths(element);
            const { data: res } = await createElement({ variables: { data: formData } });
            const { data } = res.cms.element;
            if (data.type === "block") {
                createBlockPlugin(data);
            } else {
                createElementPlugin(data);
            }

            showSnackbar(
                <span>
                    {formData.type[0].toUpperCase() + formData.type.slice(1)}{" "}
                    <strong>{data.name}</strong> saved!
                </span>
            );
        }
    }),
    lifecycle({
        componentDidUpdate() {
            const { isDialogOpened, addKeyHandler, removeKeyHandler, hideDialog } = this.props;
            isDialogOpened ? addKeyHandler("escape", hideDialog) : removeKeyHandler("escape");
        }
    })
)(SaveAction);
