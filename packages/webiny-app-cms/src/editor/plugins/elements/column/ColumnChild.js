// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import Element from "webiny-app-cms/editor/components/Element";
import { dropElement } from "webiny-app-cms/editor/actions";

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
    index,
    last = false,
    dropElementAbove,
    dropElementBelow
}: Props) => {
    return (
        <React.Fragment key={element.id}>
            <DropZone.Above type={target.type} onDrop={dropElementAbove} />
            <Element id={element.id} />
            {last && <DropZone.Below type={target.type} onDrop={dropElementBelow} />}
        </React.Fragment>
    );
};

export default compose(
    connect(
        (state, props) => ({
            element: state.elements[props.id]
        }),
        { dropElement },
        null,
        { areStatePropsEqual: (state, prevState) => isEqual(state, prevState) }
    ),
    withHandlers({
        dropElementAbove: ({ dropElement, target, index }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: index } });
        },
        dropElementBelow: ({ dropElement, target, index, count }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: count } });
        }
    })
)(ColumnChild);
