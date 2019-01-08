//@flow
import React from "react";
import ConnectedElement from "webiny-app-cms/editor/components/ConnectedElement";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import RowContainer from "./RowContainer";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

/**
 * TODO: this entire component can be further optimized (see the Chrome Profiler) to avoid unnecessary elements re-renders.
 */

const Row = ({ element }: Object) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-cms-base-element-style webiny-cms-layout-row"}
                style={{ zIndex: 20, position: "relative" }}
            >
                <ConnectedElement elementId={element.id} withChildElements>
                    {element => <RowContainer elementId={element.id} />}
                </ConnectedElement>
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Row;
