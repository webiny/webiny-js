// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, withState, withHandlers, lifecycle } from "recompose";
import { graphql } from "react-apollo";
import { getPlugin } from "webiny-app/plugins";
import SaveDialog from "./SaveDialog";
import { withSnackbar } from "webiny-app-admin/components";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import { createElementPlugin, createBlockPlugin } from "webiny-app-cms/admin/components";
import { createElement } from "webiny-app-cms/admin/graphql/pages";
import { withFileUpload } from "webiny-app/components";

type Props = {
    isDialogOpened: boolean,
    showDialog: Function,
    hideDialog: Function,
    onSubmit: Function,
    children: any,
    elementId: string,
    elementType: string
};

const SaveAction = ({
    showDialog,
    hideDialog,
    isDialogOpened,
    children,
    onSubmit,
    elementId,
    elementType
}: Props) => {
    const plugin = getPlugin(elementType);
    if (!plugin) {
        return null;
    }

    return (
        <React.Fragment>
            <SaveDialog
                key={elementId}
                open={isDialogOpened}
                onClose={hideDialog}
                onSubmit={onSubmit}
                elementId={elementId}
                type={elementType === "cms-element-block" ? "block" : "element"}
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
    connect(state => {
        const element = getActiveElement(state);
        return {
            elementId: element.id,
            elementType: element.type
        };
    }),
    withFileUpload(),
    withKeyHandler(),
    withState("isDialogOpened", "setOpenDialog", false),
    withHandlers({
        showDialog: ({ setOpenDialog }) => () => setOpenDialog(true),
        hideDialog: ({ setOpenDialog }) => () => setOpenDialog(false)
    }),
    graphql(createElement, { name: "createElement" }),
    withSnackbar(),
    withHandlers({
        onSubmit: ({ element, hideDialog, createElement, showSnackbar, uploadFile }) => async (
            formData: Object
        ) => {
            formData.preview = await uploadFile(formData.preview);
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
