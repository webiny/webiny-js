// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withState, withHandlers, lifecycle, shouldUpdate } from "recompose";
import { graphql } from "react-apollo";
import { cloneDeep } from "lodash";
import { getPlugin } from "webiny-plugins";
import SaveDialog from "./SaveDialog";
import { withSnackbar } from "webiny-admin/components";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getActiveElementId, getElementWithChildren } from "webiny-app-cms/editor/selectors";
import { createElementPlugin, createBlockPlugin } from "webiny-app-cms/admin/components";
import { createElement, updateElement } from "webiny-app-cms/admin/graphql/pages";
import { withFileUpload } from "webiny-app/components";

type Props = {
    isDialogOpened: boolean,
    showDialog: Function,
    hideDialog: Function,
    onSubmit: Function,
    children: any,
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
    if (!element) {
        return null;
    }
    const plugin = getPlugin(element.type);
    if (!plugin) {
        return null;
    }

    return (
        <React.Fragment>
            <SaveDialog
                key={element.id}
                element={element}
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
        if (el.elements && el.elements.length) {
            el = removeIdsAndPaths(el);
        }

        return el;
    });

    return el;
};

export default compose(
    connect(state => ({ element: getElementWithChildren(state, getActiveElementId(state)) })),
    withState("isDialogOpened", "setOpenDialog", false),
    shouldUpdate((props, nextProps) => {
        return props.isDialogOpened !== nextProps.isDialogOpened;
    }),
    withFileUpload(),
    withKeyHandler(),
    withHandlers({
        showDialog: ({ setOpenDialog }) => () => setOpenDialog(true),
        hideDialog: ({ setOpenDialog }) => () => setOpenDialog(false)
    }),
    graphql(createElement, { name: "createElement" }),
    graphql(updateElement, { name: "updateElement" }),
    withSnackbar(),
    withHandlers({
        onSubmit: ({
            element,
            hideDialog,
            createElement,
            updateElement,
            showSnackbar,
            uploadFile
        }) => async (formData: Object) => {
            formData.preview = await uploadFile({
                src: formData.preview,
                name: "cms-element-" + element.source
            });
            formData.content = removeIdsAndPaths(cloneDeep(element));

            let mutation = formData.overwrite ? updateElement : createElement;
            const { data: res } = await mutation({
                variables: formData.overwrite
                    ? {
                          id: element.id,
                          data: { content: formData.content, preview: formData.preview }
                      }
                    : { data: formData }
            });

            hideDialog();
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
