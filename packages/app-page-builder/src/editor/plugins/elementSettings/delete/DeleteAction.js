// @flow
import React from "react";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPlugins } from "@webiny/plugins";
import { deleteElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";

const DeleteAction = (props: Object) => {
    const { element, children } = props;

    const onClick = useHandler(props, ({ element, deleteElement }) => () => {
        deleteElement({ element });
    });

    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === element.type);
    if (!plugin) {
        return null;
    }

    if (typeof plugin.canDelete === "function") {
        if (!plugin.canDelete({ element })) {
            return null;
        }
    }

    return React.cloneElement(children, { onClick });
};

export default connect(
    state => ({ element: getActiveElement(state) }),
    { deleteElement }
)(DeleteAction);
