//@flow
import React from "react";
import ConnectedElement from "webiny-app-cms/editor/components/ConnectedElement";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import RowContainer from "./RowContainer";

/**
 * TODO: this entire component can be further optimized (see the Chrome Profiler) to avoid unnecessary elements re-renders.
 */

const Row = ({ element }: Object) => {
    return (
        <ElementStyle
            {...getElementStyleProps(element)}
            style={{ zIndex: 20, position: "relative" }}
        >
            <ConnectedElement elementId={element.id} withChildElements>
                {element => <RowContainer elementId={element.id} />}
            </ConnectedElement>
        </ElementStyle>
    );
};

export default Row;
