import React from "react";
import ConnectedElement from "@webiny/app-page-builder/editor/components/ConnectedElement";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import RowContainer from "./RowContainer";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import tryRenderingPlugin from "./../../../../utils/tryRenderingPlugin";

/**
 * TODO: this entire component can be further optimized (see the Chrome Profiler) to avoid unnecessary elements re-renders.
 */

const Row = ({ element }) => {
    const x = tryRenderingPlugin(function asd() {
        return <h3>Helloooooooooo there!!</h3>;
    });
    return (
        <ElementAnimation>
            Hello woooorld!
            {x}
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-row"}
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
