// @flow
import * as React from "react";
import { connect } from "webiny-app-page-builder/editor/redux";
import { compose, withHandlers } from "recompose";
import { getPlugins } from "webiny-plugins";
import { deleteElement } from "webiny-app-page-builder/editor/actions";
import { getActiveElement } from "webiny-app-page-builder/editor/selectors";

const DeleteAction = ({ element, children, deleteElement }: Object) => {
    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === element.type);
    if (!plugin) {
        return null;
    }

    if (typeof plugin.canDelete === "function") {
        if (!plugin.canDelete({ element })) {
            return null;
        }
    }

    return React.cloneElement(children, { onClick: deleteElement });
};

export default compose(
    connect(
        state => ({ element: getActiveElement(state) }),
        { deleteElement }
    ),
    withHandlers({
        deleteElement: ({ deleteElement, element }) => () => {
            deleteElement({ element });
        }
    })
)(DeleteAction);
