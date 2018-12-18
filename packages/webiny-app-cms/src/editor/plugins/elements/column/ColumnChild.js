// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { connect } from "webiny-app-cms/editor/redux";
import isEqual from "lodash/isEqual";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import Element from "webiny-app-cms/editor/components/Element";
import { dropElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";

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
        <div style={{ width: "100%"}}>
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
