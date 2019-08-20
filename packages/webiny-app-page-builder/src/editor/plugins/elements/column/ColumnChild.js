// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { connect } from "webiny-app-page-builder/editor/redux";
import isEqual from "lodash/isEqual";
import DropZone from "webiny-app-page-builder/editor/components/DropZone";
import Element from "webiny-app-page-builder/editor/components/Element";
import { dropElement } from "webiny-app-page-builder/editor/actions";
import { getElement } from "webiny-app-page-builder/editor/selectors";

type Props = {
    element: Object,
    index: number,
    last: boolean,
    target: Object,
    dropElementAbove: Function,
    dropElementBelow: Function
};

const ColumnChild = ({
    target,
    element,
    last = false,
    dropElementAbove,
    dropElementBelow
}: Props) => {
    return (
        <div style={{ width: "100%", position: "relative" }}>
            <DropZone.Above type={target.type} onDrop={dropElementAbove} />
            <Element id={element.id} />
            {last && <DropZone.Below type={target.type} onDrop={dropElementBelow} />}
        </div>
    );
};

export default compose(
    connect(
        (state, props) => ({
            element: getElement(state, props.id)
        }),
        { dropElement },
        null,
        { areStatePropsEqual: isEqual }
    ),
    withHandlers({
        dropElementAbove: ({ dropElement, target, index }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: index } });
        },
        dropElementBelow: ({ dropElement, target, count }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: count } });
        }
    })
)(ColumnChild);
