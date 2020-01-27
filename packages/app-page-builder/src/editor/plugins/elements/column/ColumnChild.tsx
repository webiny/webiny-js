import React from "react";
import isEqual from "lodash/isEqual";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { connect } from "@webiny/app-page-builder/editor/redux";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { dropElement } from "@webiny/app-page-builder/editor/actions";
import { getElement } from "@webiny/app-page-builder/editor/selectors";
import { PbElement } from "@webiny/app-page-builder/types";

type ColumnChildProps = {
    element: PbElement;
    index: number;
    last: boolean;
    target: { type: string };
    dropElementAbove: Function;
    dropElementBelow: Function;
};

const ColumnChild = (props: ColumnChildProps) => {
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
};

export default connect<any, any, any>(
    (state, props) => ({
        element: getElement(state, props.id)
    }),
    { dropElement },
    null,
    { areStatePropsEqual: isEqual }
)(React.memo(ColumnChild));
