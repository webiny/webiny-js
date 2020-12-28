import React from "react";
import { css } from "emotion";
import kebabCase from "lodash/kebabCase";
import Element from "@webiny/app-page-builder/render/components/Element";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import { Interpolation } from "@emotion/core";
import { ResponsiveModeContext } from "../../../../contexts/ResponsiveMode";

const Block = ({ element }: { element: PbElement }) => {
    const { editorMode } = React.useContext(ResponsiveModeContext);
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    const { width, ...containerStyle } = elementStyle;
                    // Use per-device style
                    const justifyContent =
                        elementStyle[`--${kebabCase(editorMode)}-justify-content`];
                    const alignItems = elementStyle[`--${kebabCase(editorMode)}-align-items`];

                    return (
                        <div
                            style={{ width: "100%", display: "flex", justifyContent, alignItems }}
                            className={
                                "webiny-pb-layout-block-container " +
                                css(containerStyle as Interpolation)
                            }
                            {...elementAttributes}
                        >
                            <div
                                style={{
                                    width: width ? width : "100%"
                                }}
                                className={combineClassNames(
                                    "webiny-pb-layout-block webiny-pb-base-page-element-style",
                                    ...customClasses
                                )}
                            >
                                {element.elements.map(element => (
                                    <Element key={element.id} element={element} />
                                ))}
                            </div>
                        </div>
                    );
                }}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Block;
