//@flow
import React from "react";
import ConnectedElement from "webiny-app-cms/editor/components/ConnectedElement";
import {
    ElementStyle,
    getElementStyleProps,
    getElementAttributeProps
} from "webiny-app-cms/render/components/ElementStyle";
import RowContainer from "./RowContainer";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

/**
 * TODO: this entire component can be further optimized (see the Chrome Profiler) to avoid unnecessary elements re-renders.
 */

const Row = ({ element }: Object) => {
    return (
        <ElementAnimation>
            <ElementStyle
                {...getElementStyleProps(element)}
                {...getElementAttributeProps(element)}
                className={"webiny-cms-base-element-style webiny-cms-layout-row"}
                style={{ zIndex: 20, position: "relative" }}
            >
                <ConnectedElement elementId={element.id} withChildElements>
                    {element => <RowContainer elementId={element.id} />}
                </ConnectedElement>
            </ElementStyle>
        </ElementAnimation>
    );
};

export default Row;
