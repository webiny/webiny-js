// @flow
import React from "react";
import isEqual from "lodash/isEqual";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { connect } from "@webiny/app-page-builder/editor/redux";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { dropElement } from "@webiny/app-page-builder/editor/actions";
import { getElement } from "@webiny/app-page-builder/editor/selectors";

type Props = {
    element: Object,
    index: number,
    last: boolean,
    target: Object,
    dropElementAbove: Function,
    dropElementBelow: Function
};

const ColumnChild = React.memo((props: Props) => {
    const { target, element, last = false } = props;

    const dropElementAbove = useHandler(props, ({ index, target, dropElement }) => source => {
        dropElement({ source, target: { ...target, position: index } });
    });

    const dropElementBelow = useHandler(props, ({ dropElement, count, target }) => source => {
        dropElement({ source, target: { ...target, position: count } });
    });

    return (
        <div style={{ width: "100%", position: "relative" }}>
            <DropZone.Above type={target.type} onDrop={dropElementAbove} />
            <Element id={element.id} />
            {last && <DropZone.Below type={target.type} onDrop={dropElementBelow} />}
        </div>
    );
});

export default connect(
    (state, props) => ({
        element: getElement(state, props.id)
    }),
    { dropElement },
    null,
    { areStatePropsEqual: isEqual }
)(ColumnChild);
