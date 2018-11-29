// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, withHandlers } from "recompose";
import { getPlugin } from "webiny-app/plugins";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { deleteElement } from "webiny-app-cms/editor/actions";

const DeleteAction = ({ element, children, deleteElement }: Object) => {
    const plugin = getPlugin(element.type);
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
        null,
        { deleteElement }
    ),
    withActiveElement(),
    withHandlers({
        deleteElement: ({ deleteElement, element }) => () => {
            deleteElement({ element });
        }
    })
)(DeleteAction);
