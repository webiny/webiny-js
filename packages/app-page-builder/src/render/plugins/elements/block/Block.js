//@flow
import React from "react";
import { css } from "emotion";
import Element from "@webiny/app-page-builder/render/components/Element";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import type { PbElementType } from "@webiny/app-page-builder/types";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";

const Block = ({ element }: { element: PbElementType }) => {
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    const { width, alignItems, justifyContent, ...containerStyle } = elementStyle;

                    return (
                        <div
                            style={{ width: "100%", display: "flex", justifyContent: "center" }}
                            className={"webiny-pb-layout-block-container " + css(containerStyle)}
                            {...elementAttributes}
                        >
                            <div
                                style={{
                                    width: width ? width : "100%",
                                    alignSelf: justifyContent,
                                    alignItems: alignItems
                                }}
                                className={combineClassNames(
                                    "webiny-pb-layout-block webiny-pb-base-page-element-style",
                                    ...customClasses
                                )}
                            >
                                {element.elements.map(element => (
                                    /* $FlowFixMe */
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
